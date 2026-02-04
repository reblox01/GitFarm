import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, repository, schedule, pattern } = body;

        if (!name || !repository || !schedule) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create the task
        const task = await prisma.task.create({
            data: {
                userId: session.user.id,
                name,
                repository,
                schedule,
                pattern: pattern || {},
                active: true,
            },
        });

        return NextResponse.json({ task }, { status: 201 });
    } catch (error) {
        console.error('Task creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tasks = await prisma.task.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ tasks });
    } catch (error) {
        console.error('Tasks fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
