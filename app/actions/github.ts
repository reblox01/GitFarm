'use server';

import { auth, signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

/**
 * Initiate GitHub OAuth flow to link account
 * This will redirect to GitHub OAuth with appropriate scopes for repo access
 */
export async function initiateGitHubLink() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    // Use NextAuth's signIn with GitHub provider
    // This uses the standard /api/auth/callback/github redirect URI
    // which is likely already configured in the user's GitHub App
    await signIn('github', {
        redirectTo: '/dashboard/settings?tab=integrations',
        redirect: true,
    });
}

/**
 * Fetch user's GitHub repositories using stored access token
 */
export async function fetchGitHubRepos() {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: 'Not authenticated' };
    }

    try {
        // Get user's GitHub account
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'github',
            },
            select: {
                access_token: true,
            },
        });

        if (!account?.access_token) {
            return { error: 'GitHub not connected' };
        }

        // Fetch repositories from GitHub API
        const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch repositories');
        }

        const repos = await response.json();

        return {
            success: true,
            repos: repos.map((repo: any) => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                private: repo.private,
                url: repo.html_url,
                defaultBranch: repo.default_branch,
            })),
        };
    } catch (error) {
        console.error('GitHub repos fetch error:', error);
        return { error: 'Failed to fetch repositories' };
    }
}

/**
 * Disconnect GitHub account
 */
export async function disconnectGitHub() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    try {
        await prisma.account.deleteMany({
            where: {
                userId: session.user.id,
                provider: 'github',
            },
        });

        return { success: true };
    } catch (error) {
        console.error('GitHub disconnect error:', error);
        return { error: 'Failed to disconnect GitHub' };
    }
}
