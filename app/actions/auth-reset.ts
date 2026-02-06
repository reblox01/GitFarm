'use server';

import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

export async function requestPasswordReset(formData: FormData) {
    const email = formData.get('email') as string;

    if (!email) {
        return { error: 'Email is required' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Check if user has an account but not password (e.g. GitHub only)
            // But we shouldn't reveal if user exists.
            // However, for UX, if we return success, user expects email.
            // We'll just return success blindly.
            return { success: true, message: 'If an account exists, a reset link has been sent.' };
        }

        if (!user.password) {
            return { error: 'This account uses GitHub login. please sign in with GitHub.' };
        }

        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpires: expires,
            },
        });

        await sendPasswordResetEmail(email, token);

        return { success: true, message: 'If an account exists, a reset link has been sent.' };
    } catch (error) {
        console.error('Password reset request error:', error);
        return { error: 'Something went wrong. Please try again.' };
    }
}

export async function resetPassword(token: string, formData: FormData) {
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!password || !confirmPassword) {
        return { error: 'All fields are required' };
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' };
    }

    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { resetToken: token },
        });

        if (!user) {
            return { error: 'Invalid or expired token' };
        }

        if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
            return { error: 'Token has expired' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null,
            },
        });

        return { success: true, message: 'Password reset successfully' };
    } catch (error) {
        console.error('Password reset error:', error);
        return { error: 'Failed to reset password' };
    }
}
