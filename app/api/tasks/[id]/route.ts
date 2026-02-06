import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const task = await prisma.task.findUnique({
            where: { id: params.id },
            include: {
                logs: {
                    orderBy: { timestamp: 'desc' },
                    take: 30
                }
            }
        });

        if (!task || task.userId !== session.user.id) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ task });
    } catch (error) {
        console.error('Task fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, repositories, schedule, distribution, creditLimit } = body;

        const task = await prisma.task.findUnique({
            where: { id: params.id },
        });

        if (!task || task.userId !== session.user.id) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const updatedTask = await prisma.task.update({
            where: { id: params.id },
            data: {
                name: name || undefined,
                repositories: repositories || undefined,
                schedule: schedule || undefined,
                distribution: distribution || undefined,
                creditLimit: creditLimit !== undefined ? creditLimit : undefined,
            },
        });

        return NextResponse.json({ task: updatedTask });
    } catch (error) {
        console.error('Task update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
