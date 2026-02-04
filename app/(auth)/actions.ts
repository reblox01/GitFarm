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
        redirect('/login?error=missing-credentials');
    }

    try {
        await signIn('credentials', {
            email,
            password,
            redirect: false,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            redirect('/login?error=invalid-credentials');
        }
        throw error;
    }

    // Success - redirect to dashboard
    redirect('/dashboard');
}

export async function handleRegister(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password || !name) {
        redirect('/register?error=missing-fields');
    }

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            redirect('/register?error=user-exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        // Auto sign in after registration
        await signIn('credentials', {
            email,
            password,
            redirect: false,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            redirect('/register?error=registration-failed');
        }
        throw error;
    }

    // Success - redirect to dashboard
    redirect('/dashboard');
}
