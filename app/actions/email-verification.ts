'use server';

import { prisma } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

const EmailSchema = z.string().email('Invalid email address');

export async function verifyEmail(token: string) {
    try {
        if (!token) {
            return { error: 'Invalid verification token' };
        }

        // Find user with this token
        const user = await prisma.user.findUnique({
            where: { verificationToken: token },
        });

        if (!user) {
            return { error: 'Invalid or expired verification link' };
        }

        if (user.emailVerified) {
            return { error: 'Email already verified' };
        }

        // Get site settings for free credits amount
        const settings = await prisma.siteSettings.findFirst();
        const freeCredits = settings?.freeCreditsOnVerify || 100;

        // Mark email as verified and award free credits
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                verificationToken: null, // Clear token after use
                credits: {
                    increment: freeCredits,
                },
            },
        });

        return {
            success: true,
            message: `Email verified! You've received ${freeCredits} free credits.`
        };
    } catch (error) {
        console.error('Email verification error:', error);
        return { error: 'Verification failed. Please try again.' };
    }
}

export async function resendVerificationEmail(email: string) {
    try {
        const validatedEmail = EmailSchema.parse(email);

        const user = await prisma.user.findUnique({
            where: { email: validatedEmail },
        });

        if (!user) {
            return { error: 'User not found' };
        }

        if (user.emailVerified) {
            return { error: 'Email already verified' };
        }

        // Generate new verification token if none exists
        if (!user.verificationToken) {
            const newToken = await generateVerificationToken();
            await prisma.user.update({
                where: { id: user.id },
                data: { verificationToken: newToken },
            });
            // Update local user object token for email sending
            user.verificationToken = newToken;
        }

        // Send verification email
        const result = await sendVerificationEmail(user.email, user.verificationToken!, user.name || 'User');

        if (!result.success) {
            return {
                success: false,
                error: 'Failed to send email. Please try again later.'
            };
        }

        return {
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { error: error.issues[0].message };
        }
        console.error('Resend verification error:', error);
        return { error: 'Failed to resend verification email.  Please try again.' };
    }
}

export async function generateVerificationToken(): Promise<string> {
    return crypto.randomBytes(32).toString('hex');
}
