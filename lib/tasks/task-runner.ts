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
        const isDue = isTaskDue(task.schedule);
        console.log(`👉 Checking Task: ${task.name} (${task.id}) | Schedule: "${task.schedule}" | Due: ${isDue}`);

        if (!isDue) {
            continue;
        }

        try {
            await executeTask(task);
        } catch (error) {
            console.error(`❌ Error executing task ${task.id}:`, error);
        }
    }
}

function isTaskDue(schedule: string): boolean {
    try {
        const parts = schedule.split(' ');
        if (parts.length < 2) return false;

        const scheduledMinute = parseInt(parts[0]);
        const scheduledHour = parseInt(parts[1]);

        const now = new Date();
        const currentMinute = now.getMinutes();
        const currentHour = now.getHours();

        // console.log(`   Debug Schedule: ${scheduledHour}:${scheduledMinute} vs Now: ${currentHour}:${currentMinute}`);

        return scheduledMinute === currentMinute && scheduledHour === currentHour;
    } catch (e) {
        return false;
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
        // Create initial log entry for this repo
        const log = await prisma.taskLog.create({
            data: {
                taskId: task.id,
                status: 'RUNNING',
                message: `Executing on ${repoConfig.fullName}`,
                details: [],
                repository: repoConfig.fullName
            }
        });

        const logId = log.id;

        // Re-check user credits before EACH repo run in the batch
        await logStep(logId, 'Checking user credits', 'running');
        const user = await prisma.user.findUnique({
            where: { id: task.userId },
            select: { credits: true }
        });

        if (!user || user.credits <= 0) {
            await logStep(logId, 'Checking user credits', 'error');
            await updateLogStatus(logId, 'FAILED', 'Stopped execution: Ran out of credits');
            break;
        }
        await logStep(logId, 'Checking user credits', 'done');

        // Re-check task limit
        const currentTask = await prisma.task.findUnique({
            where: { id: task.id },
            select: { creditsUsed: true, creditLimit: true }
        });

        if (currentTask && currentTask.creditLimit !== null && currentTask.creditsUsed >= currentTask.creditLimit) {
            await updateLogStatus(logId, 'SUCCESS', 'Task reached credit limit during batch execution');
            break;
        }

        const commitsToRun = Math.min(repoConfig.commits || 1, user.credits);

        await logStep(logId, `Preparing ${commitsToRun} commits`, 'running');
        // 5. Get Repo State
        const repoStateResult = await getRepoStateInternal(task.userId, repoConfig.fullName);
        if (repoStateResult.error) {
            await logStep(logId, `Preparing ${commitsToRun} commits`, 'error');
            await updateLogStatus(logId, 'FAILED', `Repo error: ${repoStateResult.error}`);
            continue;
        }
        await logStep(logId, `Preparing ${commitsToRun} commits`, 'done');

        const { sha, branch } = repoStateResult;

        // 6. Create Commits
        await logStep(logId, 'Generating commits', 'running');
        const commits = Array.from({ length: commitsToRun }).map((_, i) => ({
            date: new Date(Date.now() - (commitsToRun - 1 - i) * 1000).toISOString(),
            message: `chore: contribution update [bot]`,
            parentSha: sha
        }));

        const result = await createCommitBatchInternal(task.userId, repoConfig.fullName, commits);

        if (result.error) {
            await logStep(logId, 'Generating commits', 'error');
            await updateLogStatus(logId, 'FAILED', `Commit error: ${result.error}`);
            continue;
        }
        await logStep(logId, 'Generating commits', 'done');

        // 7. Push Changes
        await logStep(logId, 'Pushing changes', 'running');
        const pushResult = await pushChangesInternal(task.userId, repoConfig.fullName, branch, result.lastSha);

        if (pushResult.error) {
            await logStep(logId, 'Pushing changes', 'error');
            await updateLogStatus(logId, 'FAILED', `Push error: ${pushResult.error}`);
            continue;
        }
        await logStep(logId, 'Pushing changes', 'done');

        // 8. Update Stats & Log Success for this repo
        await prisma.task.update({
            where: { id: task.id },
            data: {
                creditsUsed: { increment: commitsToRun }
            }
        });

        await updateLogStatus(logId, 'SUCCESS', 'Executed successfully.', commitsToRun, commitsToRun);
    }
}

async function logStep(logId: string, stepName: string, status: 'running' | 'done' | 'error') {
    // We need to fetch current details first to append
    const log = await prisma.taskLog.findUnique({ where: { id: logId }, select: { details: true } });
    const currentDetails = (log?.details as any[]) || [];

    // Check if step exists to update or push new
    const existingIndex = currentDetails.findIndex((s: any) => s.step === stepName);
    const timestamp = new Date().toISOString();

    if (existingIndex >= 0) {
        currentDetails[existingIndex] = { ...currentDetails[existingIndex], status, timestamp };
    } else {
        currentDetails.push({ step: stepName, status, timestamp });
    }

    await prisma.taskLog.update({
        where: { id: logId },
        data: { details: currentDetails }
    });
}

async function updateLogStatus(logId: string, status: LogStatus, message: string, commits: number = 0, credits: number = 0) {
    await prisma.taskLog.update({
        where: { id: logId },
        data: {
            status,
            message,
            commitsCount: commits,
            creditsDeducted: credits
        }
    });
}

async function logTask(taskId: string, status: LogStatus, message: string, commits: number = 0, credits: number = 0, repo?: string) {
    await prisma.taskLog.create({
        data: {
            taskId,
            status,
            message,
            commitsCount: commits,
            creditsDeducted: credits,
            repository: repo,
            details: []
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
