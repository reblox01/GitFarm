'use server';

import { signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import { checkRateLimit, authLimiter } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { sendVerificationEmail } from '@/lib/email';


const PasswordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const LoginSchema = z.object({
    email: z.string().email('Invalid email address').max(255),
    password: z.string().min(1, 'Password is required'),
});

const RegisterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address').max(255),
    password: PasswordSchema,
});

export async function handleGithubSignIn() {
    await signIn('github', { redirectTo: '/dashboard' });
}

export async function handleCredentialsSignIn(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = LoginSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message };
    }

    const { email, password } = validatedFields.data;

    // Rate limiting (per IP for public endpoint)
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || 'unknown';
    const { success } = await checkRateLimit(authLimiter, `login:${ip}`);

    if (!success) {
        return { error: 'Too many login attempts. Please try again in 15 minutes.' };
    }

    try {
        await signIn('credentials', {
            email,
            password,
            redirect: false,
        });
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: 'Invalid credentials' };
        }
        return { error: 'An unexpected error occurred' };
    }
}

export async function handleRegister(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = RegisterSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message };
    }

    const { name, email, password } = validatedFields.data;

    // Rate limiting (per IP)
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || 'unknown';
    const { success } = await checkRateLimit(authLimiter, `register:${ip}`);

    if (!success) {
        return { error: 'Too many registration attempts. Please try again later.' };
    }

    try {
        // ... existing registration logic
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return { error: 'User already exists' };
        }

        // Get site settings for email verification requirement
        const settings = await prisma.siteSettings.findFirst();
        const requireVerification = settings?.requireEmailVerify !== false;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate verification token
        const verificationToken = requireVerification
            ? require('crypto').randomBytes(32).toString('hex')
            : null;

        // Create user with 0 credits if verification required
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                credits: requireVerification ? 0 : 100, // 0 credits until verified
                emailVerified: requireVerification ? null : new Date(), // Auto-verify if not required
                verificationToken,
            },
        });

        // Get the default plan if it exists
        const defaultPlan = await prisma.plan.findFirst({
            where: { isDefault: true }
        });

        // Create subscription if default plan exists
        if (defaultPlan) {
            await prisma.userSubscription.create({
                data: {
                    userId: user.id,
                    planId: defaultPlan.id,
                    status: 'ACTIVE',
                    provider: 'STRIPE', // Local default
                }
            });
        }

        // Send verification email if required
        if (requireVerification && verificationToken) {
            const emailResult = await sendVerificationEmail(user.email, verificationToken, user.name || 'User');
            if (!emailResult.success) {
                console.error('Failed to send verification email during registration:', emailResult.error);
                // Note: We don't block registration, but this log will help debug API key issues
            }
        }

        // Auto sign in after registration
        await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        return { success: true };
    } catch (error) {
        console.error('Registration error:', error);
        return { error: 'Registration failed. Please try again.' };
    }
}
