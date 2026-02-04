'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function toggleTask(taskId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });

        if (!task || task.userId !== session.user.id) {
            return { error: 'Task not found' };
        }

        await prisma.task.update({
            where: { id: taskId },
            data: { active: !task.active },
        });

        revalidatePath('/dashboard/tasks');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to toggle task' };
    }
}

export async function deleteTask(taskId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });

        if (!task || task.userId !== session.user.id) {
            return { error: 'Task not found' };
        }

        await prisma.task.delete({
            where: { id: taskId },
        });

        revalidatePath('/dashboard/tasks');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete task' };
    }
}
