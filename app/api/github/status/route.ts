import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ connected: false });
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

        return NextResponse.json({ connected: !!account?.access_token });
    } catch (error) {
        console.error('GitHub status check error:', error);
        return NextResponse.json({ connected: false }, { status: 500 });
    }
}
