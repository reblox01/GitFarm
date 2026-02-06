import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { checkRateLimit, apiLimiter } from '@/lib/rate-limit';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ connected: false, username: null });
        }

        // Rate limiting (per user)
        const { success } = await checkRateLimit(apiLimiter, session.user.id);
        if (!success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

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
            return NextResponse.json({ connected: false, username: null });
        }

        // Fetch GitHub user info to get username
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${account.access_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });

            if (response.ok) {
                const githubUser = await response.json();
                return NextResponse.json({
                    connected: true,
                    username: githubUser.login,
                    avatarUrl: githubUser.avatar_url,
                });
            }
        } catch (error) {
            console.error('Failed to fetch GitHub user:', error);
        }

        // Fallback if we can't fetch user info but token exists
        return NextResponse.json({ connected: true, username: null });
    } catch (error) {
        console.error('GitHub status check error:', error);
        return NextResponse.json({ connected: false, username: null }, { status: 500 });
    }
}
