'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { sendInvitationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function inviteUser(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    const email = formData.get('email') as string;
    const role = formData.get('role') as Role || 'USER';

    if (!email) return { error: 'Email is required' };

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { error: 'User with this email already exists' };
        }

        // Check if invitation already exists
        const existingInvite = await prisma.invitation.findFirst({ where: { email } });
        if (existingInvite) {
            // Update existing invite? Or error?
            // Let's renew it.
            const token = randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            await prisma.invitation.update({
                where: { id: existingInvite.id },
                data: { token, expires, role, createdAt: new Date() }
            });

            await sendInvitationEmail(email, token, session.user.name || 'Admin');
            revalidatePath('/admin/users');
            return { success: true, message: 'Invitation resent' };
        }

        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await prisma.invitation.create({
            data: {
                email,
                role,
                token,
                expires,
                inviterId: session.user.id || 'unknown',
            },
        });

        await sendInvitationEmail(email, token, session.user.name || 'Admin');
        revalidatePath('/admin/users');
        return { success: true, message: 'Invitation sent' };
    } catch (error) {
        console.error('Invite error:', error);
        return { error: 'Failed to send invitation' };
    }
}

export async function revokeInvitation(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    try {
        await prisma.invitation.delete({ where: { id } });
        revalidatePath('/admin/users');
        return { success: true, message: 'Invitation revoked' };
    } catch (error) {
        return { error: 'Failed to revoke invitation' };
    }
}

export async function acceptInvitation(token: string, formData: FormData) {
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    if (!password || password.length < 8) return { error: 'Password too short' };
    if (!name) return { error: 'Name is required' };

    try {
        const invite = await prisma.invitation.findUnique({ where: { token } });

        if (!invite) return { error: 'Invalid invitation' };
        if (invite.expires < new Date()) return { error: 'Invitation expired' };

        const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
        if (existingUser) return { error: 'User already exists' };

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction(async (tx) => {
            await tx.user.create({
                data: {
                    email: invite.email,
                    name,
                    password: hashedPassword,
                    role: invite.role,
                    emailVerified: new Date(), // Auto-verify invited users
                }
            });

            await tx.invitation.delete({ where: { id: invite.id } });
        });

        return { success: true };
    } catch (error) {
        console.error('Accept invite error:', error);
        return { error: 'Failed to accept invitation' };
    }
}
