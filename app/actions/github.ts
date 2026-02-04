'use server';

import { auth } from '@/lib/auth';
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

    // Build GitHub OAuth URL with required scopes
    const githubClientId = process.env.GITHUB_CLIENT_ID!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/github`;

    const scopes = [
        'repo', // Full control of private repositories
        'user:email', // Access user email addresses
        'read:user', // Read user profile data
    ].join(' ');

    const state = Buffer.from(JSON.stringify({
        userId: session.user.id,
        action: 'link',
    })).toString('base64');

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', githubClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    redirect(authUrl.toString());
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
