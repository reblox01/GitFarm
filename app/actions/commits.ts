'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface GenerateCommitsResult {
    success?: boolean;
    error?: string;
    commitsCreated?: number;
}

/**
 * Generate commits on a specific repository
 * @param repository Full repository name (owner/repo)
 * @param pattern Array of dates to commit on (YYYY-MM-DD)
 */
export async function generateCommits(
    repository: string,
    pattern: { date: string; count: number }[]
): Promise<GenerateCommitsResult> {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        // 1. Get GitHub Access Token
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'github',
            },
            select: { access_token: true },
        });

        if (!account?.access_token) {
            return { error: 'GitHub not connected' };
        }

        // 2. Verify Repository Access & Get Default Branch
        const repoResponse = await fetch(`https://api.github.com/repos/${repository}`, {
            headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!repoResponse.ok) {
            return { error: 'Repository not found or access denied' };
        }

        const repoData = await repoResponse.json();
        const defaultBranch = repoData.default_branch;

        // 3. Get Reference to HEAD
        const refResponse = await fetch(`https://api.github.com/repos/${repository}/git/ref/heads/${defaultBranch}`, {
            headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!refResponse.ok) {
            return { error: 'Failed to fetch repository reference' };
        }

        const refData = await refResponse.json();
        let currentCommitSha = refData.object.sha;
        let commitsCreated = 0;

        // 4. Create Commits Sequentially
        // Note: For large patterns, this might timeout. Standard Vercel timeout is 10s (Hobby) / 60s (Pro).
        // We should process in chunks or limit the batch size.
        // For now, we'll process up to 20 commits in one go to be safe.

        const MAX_COMMITS_PER_BATCH = 20;
        let processedCount = 0;

        // Flatten the pattern into individual commits
        const commitQueue: string[] = [];
        for (const day of pattern) {
            for (let i = 0; i < day.count; i++) {
                commitQueue.push(day.date);
            }
        }

        // Process a batch
        const batch = commitQueue.slice(0, MAX_COMMITS_PER_BATCH);

        for (const dateStr of batch) {
            // Create a pseudo-random time for the commit (between 9 AM and 6 PM)
            const date = new Date(dateStr);
            date.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60), 0);

            const isoDate = date.toISOString();

            // A. Create Tree (we'll just use the previous commit's tree to keep it empty/clean)
            const commitInfoResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits/${currentCommitSha}`, {
                headers: {
                    'Authorization': `Bearer ${account.access_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });
            const commitInfo = await commitInfoResponse.json();
            const treeSha = commitInfo.tree.sha;

            // B. Create Commit
            const createCommitResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${account.access_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Contribution: ${dateStr}`,
                    tree: treeSha,
                    parents: [currentCommitSha],
                    author: {
                        name: session.user.name || 'GitFarm User',
                        email: session.user.email,
                        date: isoDate,
                    },
                    committer: {
                        name: session.user.name || 'GitFarm User',
                        email: session.user.email,
                        date: isoDate, // Backdating happening here
                    },
                }),
            });

            if (!createCommitResponse.ok) {
                console.error('Failed to create commit:', await createCommitResponse.text());
                continue;
            }

            const newCommit = await createCommitResponse.json();
            currentCommitSha = newCommit.sha;
            commitsCreated++;
        }

        // 5. Update Reference (Push)
        if (commitsCreated > 0) {
            const updateRefResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${defaultBranch}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${account.access_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sha: currentCommitSha,
                    force: false,
                }),
            });

            if (!updateRefResponse.ok) {
                return { error: 'Failed to push commits' };
            }
        }

        revalidatePath('/dashboard');

        if (batch.length < commitQueue.length) {
            return {
                success: true,
                commitsCreated,
                error: `Processed ${commitsCreated} commits. ${commitQueue.length - commitsCreated} remaining (batch limit). Please click Generate again.`
            };
        }

        return { success: true, commitsCreated };

    } catch (error) {
        console.error('Generate commits error:', error);
        return { error: 'Internal server error' };
    }
}
