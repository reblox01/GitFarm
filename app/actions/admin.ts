'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

export async function updateUserRole(userId: string, newRole: Role) {
    const session = await auth();

    // Check if requester is ADMIN
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    try {
        // Prevent modifying own role to avoid locking oneself out
        if (userId === session.user.id) {
            return { error: 'Cannot modify your own role' };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Update role error:', error);
        return { error: 'Failed to update role' };
    }
}

export async function deleteUser(userId: string) {
    const session = await auth();

    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    try {
        if (userId === session.user.id) {
            return { error: 'Cannot delete your own account' };
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Delete user error:', error);
        return { error: 'Failed to delete user' };
    }
}
