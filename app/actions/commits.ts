'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkRateLimit, apiLimiter } from '@/lib/rate-limit';

// Validation Schemas
const RepoNameSchema = z.string().regex(/^[a-zA-Z0-9-._]+\/[a-zA-Z0-9-._]+$/);
const BranchNameSchema = z.string().min(1).max(255);
const ShaSchema = z.string().regex(/^[a-f0-9]{40}$/);

const CommitBatchSchema = z.array(z.object({
    date: z.string().datetime(),
    message: z.string().min(1).max(255),
    parentSha: z.string()
}));

const CommitJobSchema = z.object({
    repository: RepoNameSchema,
    totalCommits: z.number().int().min(1),
    status: z.enum(['COMPLETED', 'FAILED']),
    errorMessage: z.string().optional(),
});

// Shared validation helper
async function getGitHubAccount(userId: string) {
    const account = await prisma.account.findFirst({
        where: { userId, provider: 'github' },
        select: { access_token: true },
    });
    if (!account?.access_token) throw new Error('GitHub not connected');
    return account.access_token;
}

export async function getRepoState(repository: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    try {
        const validatedRepo = RepoNameSchema.parse(repository);
        const token = await getGitHubAccount(session.user.id);

        // Get default branch
        const repoResponse = await fetch(`https://api.github.com/repos/${validatedRepo}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!repoResponse.ok) return { error: 'Repository not found' };
        const repoData = await repoResponse.json();
        const defaultBranch = repoData.default_branch;

        // Get HEAD sha
        const refUrl = `https://api.github.com/repos/${validatedRepo}/git/ref/heads/${defaultBranch}`;
        const refResponse = await fetch(refUrl, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!refResponse.ok) {
            const errorText = await refResponse.text();
            console.error(`Failed to fetch HEAD (${refResponse.status}):`, errorText);

            if (refResponse.status === 409) {
                return { error: 'Repository is empty. Please initialize it with a commit first.' };
            }
            if (refResponse.status === 404) {
                return { error: `Branch '${defaultBranch}' not found. Is the repository empty?` };
            }

            return { error: `Failed to fetch HEAD: ${refResponse.status} ${errorText}` };
        }

        const refData = await refResponse.json();

        // Get commit count (via per_page=1 trick)
        const commitsResponse = await fetch(`https://api.github.com/repos/${validatedRepo}/commits?per_page=1&sha=${defaultBranch}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        let commitCount = 0;
        const linkHeader = commitsResponse.headers.get('Link');
        if (linkHeader) {
            const match = linkHeader.match(/page=(\d+)>; rel="last"/);
            if (match) {
                commitCount = parseInt(match[1]);
            } else if (commitsResponse.ok) {
                // If there's no "last" link but the request succeeded, it might be the only page
                const data = await commitsResponse.json();
                commitCount = data.length;
            }
        } else if (commitsResponse.ok) {
            const data = await commitsResponse.json();
            commitCount = data.length;
        }

        return {
            success: true,
            sha: refData.object.sha,
            branch: defaultBranch,
            commitCount,
        };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function createCommitBatch(
    repository: string,
    commits: { date: string; message: string; parentSha: string }[]
) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    try {
        const validatedRepo = RepoNameSchema.parse(repository);
        const validatedCommits = CommitBatchSchema.parse(commits);
        const userId = session.user.id;
        const commitCount = validatedCommits.length;

        // Rate limiting (per user)
        const { success: rateOk } = await checkRateLimit(apiLimiter, `commits:${userId}`);
        if (!rateOk) {
            throw new Error('Too many commit requests. Please wait.');
        }

        // 1. Check Credits
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true }
        });

        if (!user || user.credits < commitCount) {
            return { error: `Insufficient credits. You need ${commitCount} credits for this batch, but you only have ${user?.credits || 0}.` };
        }

        const token = await getGitHubAccount(userId);
        const results: { sha: string; date: string }[] = [];
        let currentParentSha = validatedCommits[0].parentSha;

        for (const commit of validatedCommits) {
            // Get tree from parent
            const commitInfoResponse = await fetch(`https://api.github.com/repos/${validatedRepo}/git/commits/${currentParentSha}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!commitInfoResponse.ok) {
                throw new Error(`Failed to fetch parent commit: ${await commitInfoResponse.text()}`);
            }

            const commitInfo = await commitInfoResponse.json();
            const treeSha = commitInfo.tree.sha;

            // Create commit
            const response = await fetch(`https://api.github.com/repos/${validatedRepo}/git/commits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: commit.message,
                    tree: treeSha,
                    parents: [currentParentSha],
                    author: {
                        name: session.user.name || 'GitFarm User',
                        email: session.user.email,
                        date: commit.date,
                    },
                    committer: {
                        name: session.user.name || 'GitFarm User',
                        email: session.user.email,
                        date: commit.date,
                    },
                }),
            });

            if (!response.ok) {
                console.error('Commit failed:', await response.text());
                throw new Error('Failed to create commit');
            }

            const newCommit = await response.json();
            currentParentSha = newCommit.sha;
            results.push({ sha: newCommit.sha, date: commit.date });
        }

        // 2. Deduct Credits after successful batch
        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { decrement: results.length }
            }
        });

        revalidatePath('/dashboard');
        return { success: true, lastSha: currentParentSha, count: results.length };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function pushChanges(repository: string, branch: string, sha: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    try {
        const validatedRepo = RepoNameSchema.parse(repository);
        const validatedBranch = BranchNameSchema.parse(branch);
        const validatedSha = ShaSchema.parse(sha);

        const token = await getGitHubAccount(session.user.id);
        const response = await fetch(`https://api.github.com/repos/${validatedRepo}/git/refs/heads/${validatedBranch}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sha: validatedSha, force: false }),
        });

        if (!response.ok) return { error: 'Failed to push changes' };

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function initializeRepository(repository: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    try {
        const validatedRepo = RepoNameSchema.parse(repository);
        const token = await getGitHubAccount(session.user.id);

        // Create README.md
        const content = Buffer.from(`# ${validatedRepo.split('/')[1]}\n\nInitialized by GitFarm`).toString('base64');

        const response = await fetch(`https://api.github.com/repos/${validatedRepo}/contents/README.md`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Initial commit',
                content: content,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { error: `Failed to initialize: ${errorText}` };
        }

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function recordCommitJob(data: {
    repository: string;
    totalCommits: number;
    status: 'COMPLETED' | 'FAILED';
    errorMessage?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    try {
        const validated = CommitJobSchema.parse(data);

        await prisma.commitJob.create({
            data: {
                userId: session.user.id,
                status: validated.status,
                totalCommits: validated.totalCommits,
                completedCommits: validated.status === 'COMPLETED' ? validated.totalCommits : 0,
                repositoryUrl: validated.repository,
                errorMessage: validated.errorMessage,
                pattern: {}, // Simplified for history
                completedAt: validated.status === 'COMPLETED' ? new Date() : null,
            },
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
