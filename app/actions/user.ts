'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!name || !email) {
        return { error: 'Name and email are required' };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                email,
            },
        });

        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error) {
        console.error('Profile update error:', error);
        return { error: 'Failed to update profile' };
    }
}

export async function changePassword(formData: FormData) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: 'All fields are required' };
    }

    if (newPassword !== confirmPassword) {
        return { error: 'New passwords do not match' };
    }

    if (newPassword.length < 8) {
        return { error: 'Password must be at least 8 characters' };
    }

    try {
        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { password: true },
        });

        if (!user?.password) {
            return { error: 'Cannot change password for OAuth accounts' };
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return { error: 'Current password is incorrect' };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });

        return { success: true };
    } catch (error) {
        console.error('Password change error:', error);
        return { error: 'Failed to change password' };
    }
}
