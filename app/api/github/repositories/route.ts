import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get GitHub access token
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
            return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
        }

        // Fetch repositories from GitHub
        const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            console.error('GitHub API error:', await response.text());
            return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: response.status });
        }

        const repos = await response.json();

        // Transform to our format
        const repositories = repos.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            description: repo.description,
            url: repo.html_url,
            defaultBranch: repo.default_branch,
        }));

        return NextResponse.json({ repositories });
    } catch (error) {
        console.error('Repository fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
