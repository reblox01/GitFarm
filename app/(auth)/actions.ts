// Server action for user registration
'use server';

import { signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

export async function handleGithubSignIn() {
    await signIn('github', { redirectTo: '/dashboard' });
}

export async function handleCredentialsSignIn(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Missing credentials' };
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
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password || !name) {
        return { error: 'Missing required fields' };
    }

    try {
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
