'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

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
        const token = await getGitHubAccount(session.user.id);

        // Get default branch
        const repoResponse = await fetch(`https://api.github.com/repos/${repository}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!repoResponse.ok) return { error: 'Repository not found' };
        const repoData = await repoResponse.json();
        const defaultBranch = repoData.default_branch;

        // Get HEAD sha
        const refUrl = `https://api.github.com/repos/${repository}/git/ref/heads/${defaultBranch}`;
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
        const commitsResponse = await fetch(`https://api.github.com/repos/${repository}/commits?per_page=1&sha=${defaultBranch}`, {
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
        const token = await getGitHubAccount(session.user.id);
        const results: { sha: string; date: string }[] = [];
        let currentParentSha = commits[0].parentSha;

        for (const commit of commits) {
            // Get tree from parent (empty tree trick or just use parent's tree)
            const commitInfoResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits/${currentParentSha}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const commitInfo = await commitInfoResponse.json();
            const treeSha = commitInfo.tree.sha;

            // Create commit
            const response = await fetch(`https://api.github.com/repos/${repository}/git/commits`, {
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

        return { success: true, lastSha: currentParentSha, count: results.length };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function pushChanges(repository: string, branch: string, sha: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    try {
        const token = await getGitHubAccount(session.user.id);
        const response = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${branch}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sha, force: false }),
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
        const token = await getGitHubAccount(session.user.id);

        // Create README.md
        const content = Buffer.from(`# ${repository.split('/')[1]}\n\nInitialized by GitFarm`).toString('base64');

        const response = await fetch(`https://api.github.com/repos/${repository}/contents/README.md`, {
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
