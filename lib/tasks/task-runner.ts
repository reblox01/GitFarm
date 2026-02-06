import { prisma } from '@/lib/db';
import { getRepoState, pushChanges } from '@/app/actions/commits';
import { Task, LogStatus } from '@prisma/client';

interface RepoConfig {
    fullName: string;
    commits: number;
}

export async function runDueTasks() {
    console.log('🕒 Starting task runner execution...');

    const tasks = await prisma.task.findMany({
        where: { active: true },
        include: {
            user: true
        }
    });

    console.log(`🔍 Found ${tasks.length} active tasks.`);

    for (const task of tasks) {
        try {
            await executeTask(task);
        } catch (error) {
            console.error(`❌ Error executing task ${task.id}:`, error);
        }
    }
}

async function executeTask(task: any) {
    // 1. Initial credit limit check ("stop when...")
    if (task.creditLimit !== null && task.creditsUsed >= task.creditLimit) {
        console.log(`⚠️ Task "${task.name}" (${task.id}) reached credit limit (${task.creditLimit}). Deactivating.`);
        await prisma.task.update({
            where: { id: task.id },
            data: { active: false }
        });
        return;
    }

    // 2. Initial user credits balance check
    if (task.user.credits <= 0) {
        await logTask(task.id, 'FAILED', 'User has no credits left.', 0, 0);
        return;
    }

    // 3. Determine Repositories
    const repos = task.repositories as unknown as RepoConfig[];
    if (!repos || repos.length === 0) {
        await logTask(task.id, 'FAILED', 'No repositories configured for this task.', 0, 0);
        return;
    }

    let targetRepos: RepoConfig[] = [];
    if (task.distribution === 'RANDOM') {
        // Pick one random repo and do 1 commit
        const randomRepo = repos[Math.floor(Math.random() * repos.length)];
        targetRepos = [{ ...randomRepo, commits: 1 }];
    } else {
        // EQUAL (Even Coverage) - Execute all configured repos with their specific counts
        targetRepos = repos.filter(r => (r.commits || 0) > 0);
    }

    console.log(`🚀 Executing task "${task.name}" on ${targetRepos.length} target repositories.`);

    for (const repoConfig of targetRepos) {
        // Re-check user credits before EACH repo run in the batch
        const user = await prisma.user.findUnique({
            where: { id: task.userId },
            select: { credits: true }
        });

        if (!user || user.credits <= 0) {
            await logTask(task.id, 'FAILED', `Stopped execution: Ran out of credits at ${repoConfig.fullName}`, 0, 0, repoConfig.fullName);
            break;
        }

        // Re-check task limit
        const currentTask = await prisma.task.findUnique({
            where: { id: task.id },
            select: { creditsUsed: true, creditLimit: true }
        });

        if (currentTask && currentTask.creditLimit !== null && currentTask.creditsUsed >= currentTask.creditLimit) {
            console.log(`⚠️ Task reached limit during batch execution at ${repoConfig.fullName}.`);
            break;
        }

        const commitsToRun = Math.min(repoConfig.commits || 1, user.credits);
        console.log(`  - Pushing ${commitsToRun} commits to ${repoConfig.fullName}`);

        // 5. Get Repo State
        const repoStateResult = await getRepoStateInternal(task.userId, repoConfig.fullName);
        if (repoStateResult.error) {
            await logTask(task.id, 'FAILED', `Repo error: ${repoStateResult.error}`, 0, 0, repoConfig.fullName);
            continue;
        }

        const { sha, branch } = repoStateResult;

        // 6. Create Commits
        const commits = Array.from({ length: commitsToRun }).map((_, i) => ({
            date: new Date(Date.now() - (commitsToRun - 1 - i) * 1000).toISOString(),
            message: `chore: contribution update [bot]`,
            parentSha: sha // createCommitBatchInternal handles sequential parenting
        }));

        const result = await createCommitBatchInternal(task.userId, repoConfig.fullName, commits);

        if (result.error) {
            await logTask(task.id, 'FAILED', `Commit error: ${result.error}`, 0, 0, repoConfig.fullName);
            continue;
        }

        // 7. Push Changes
        const pushResult = await pushChangesInternal(task.userId, repoConfig.fullName, branch, result.lastSha);

        if (pushResult.error) {
            await logTask(task.id, 'FAILED', `Push error: ${pushResult.error}`, 0, 0, repoConfig.fullName);
            continue;
        }

        // 8. Update Stats & Log Success for this repo
        await prisma.task.update({
            where: { id: task.id },
            data: {
                creditsUsed: { increment: commitsToRun }
            }
        });

        await logTask(task.id, 'SUCCESS', 'Executed successfully.', commitsToRun, commitsToRun, repoConfig.fullName);
    }
}

async function logTask(taskId: string, status: LogStatus, message: string, commits: number, credits: number, repo?: string) {
    await prisma.taskLog.create({
        data: {
            taskId,
            status,
            message,
            commitsCount: commits,
            creditsDeducted: credits,
            repository: repo,
        }
    });
}

async function getRepoStateInternal(userId: string, repository: string) {
    const account = await prisma.account.findFirst({ where: { userId, provider: 'github' } });
    if (!account?.access_token) return { error: 'GitHub not connected' };

    const token = account.access_token;
    return await fetchRepoState(token, repository);
}

async function fetchRepoState(token: string, repository: string): Promise<any> {
    const repoResponse = await fetch(`https://api.github.com/repos/${repository}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!repoResponse.ok) return { error: 'Repository not found' };
    const repoData = await repoResponse.json();
    const defaultBranch = repoData.default_branch;

    const refUrl = `https://api.github.com/repos/${repository}/git/ref/heads/${defaultBranch}`;
    const refResponse = await fetch(refUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!refResponse.ok) return { error: 'Failed to fetch HEAD' };
    const refData = await refResponse.json();

    return { sha: refData.object.sha, branch: defaultBranch };
}

async function createCommitBatchInternal(userId: string, repository: string, commits: any[]) {
    const account = await prisma.account.findFirst({ where: { userId, provider: 'github' } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!account?.access_token) return { error: 'GitHub not connected' };
    if (!user || user.credits < commits.length) return { error: 'Insufficient credits' };

    const token = account.access_token;
    let currentParentSha = commits[0].parentSha;

    for (const commit of commits) {
        const commitInfoResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits/${currentParentSha}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!commitInfoResponse.ok) return { error: 'Failed to fetch parent' };
        const treeSha = (await commitInfoResponse.json()).tree.sha;

        const response = await fetch(`https://api.github.com/repos/${repository}/git/commits`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: commit.message,
                tree: treeSha,
                parents: [currentParentSha],
                author: { name: user.name || 'GitFarm Bot', email: user.email, date: commit.date },
                committer: { name: user.name || 'GitFarm Bot', email: user.email, date: commit.date },
            }),
        });
        if (!response.ok) return { error: 'Failed to create commit' };
        currentParentSha = (await response.json()).sha;
    }

    await prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: commits.length } }
    });

    return { success: true, lastSha: currentParentSha };
}

async function pushChangesInternal(userId: string, repository: string, branch: string, sha: string) {
    const account = await prisma.account.findFirst({ where: { userId, provider: 'github' } });
    if (!account?.access_token) return { error: 'GitHub not connected' };

    const token = account.access_token;
    const response = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha, force: false }),
    });

    if (!response.ok) return { error: 'Failed to push' };
    return { success: true };
}
