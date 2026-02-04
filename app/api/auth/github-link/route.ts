import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Custom GitHub callback handler
 * This handles the OAuth callback and links the GitHub account to the logged-in user
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
        return new Response('Missing code parameter', { status: 400 });
    }

    try {
        const session = await auth();

        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID!,
                client_secret: process.env.GITHUB_CLIENT_SECRET!,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('GitHub token error:', tokenData);
            return Response.redirect(new URL('/dashboard/settings?error=github_auth_failed', request.url));
        }

        // Get GitHub user info
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        const githubUser = await userResponse.json();

        if (session?.user?.id) {
            // User is logged in, link the GitHub account
            await prisma.account.upsert({
                where: {
                    provider_providerAccountId: {
                        provider: 'github',
                        providerAccountId: String(githubUser.id),
                    },
                },
                create: {
                    userId: session.user.id,
                    type: 'oauth',
                    provider: 'github',
                    providerAccountId: String(githubUser.id),
                    access_token: tokenData.access_token,
                    token_type: tokenData.token_type,
                    scope: tokenData.scope,
                },
                update: {
                    access_token: tokenData.access_token,
                    token_type: tokenData.token_type,
                    scope: tokenData.scope,
                },
            });

            // Redirect back to settings
            return Response.redirect(new URL('/dashboard/settings?tab=integrations&success=github_connected', request.url));
        } else {
            // No active session - redirect to login
            return Response.redirect(new URL('/login', request.url));
        }
    } catch (error) {
        console.error('GitHub callback error:', error);
        return Response.redirect(new URL('/dashboard/settings?error=github_auth_failed', request.url));
    }
}
