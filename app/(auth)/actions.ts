'use server';

import { signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import { checkRateLimit, authLimiter } from '@/lib/rate-limit';
import { headers } from 'next/headers';

const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

const RegisterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
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

        // Get the default plan if it exists
        const defaultPlan = await prisma.plan.findFirst({
            where: { isDefault: true }
        });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user with default credits
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                credits: defaultPlan?.credits || 0,
            },
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
