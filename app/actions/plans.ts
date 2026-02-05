'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createPlan(data: {
    name: string;
    price: number;
    stripeProductId?: string;
    isDefault?: boolean;
}) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    try {
        if (data.isDefault) {
            // Unset other defaults
            await prisma.plan.updateMany({
                where: { isDefault: true },
                data: { isDefault: false },
            });
        }

        await prisma.plan.create({
            data: {
                name: data.name,
                price: data.price,
                stripeProductId: data.stripeProductId,
                isDefault: data.isDefault || false,
            },
        });

        revalidatePath('/admin/plans');
        return { success: true };
    } catch (error) {
        console.error('Create plan error:', error);
        return { error: 'Failed to create plan' };
    }
}

export async function updatePlan(id: string, data: {
    name: string;
    price: number;
    stripeProductId?: string;
    isDefault?: boolean;
}) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    try {
        if (data.isDefault) {
            // Unset other defaults
            await prisma.plan.updateMany({
                where: { isDefault: true, NOT: { id } },
                data: { isDefault: false },
            });
        }

        await prisma.plan.update({
            where: { id },
            data: {
                name: data.name,
                price: data.price,
                stripeProductId: data.stripeProductId,
                isDefault: data.isDefault || false,
            },
        });

        revalidatePath('/admin/plans');
        return { success: true };
    } catch (error) {
        console.error('Update plan error:', error);
        return { error: 'Failed to update plan' };
    }
}

export async function deletePlan(planId: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    try {
        await prisma.plan.delete({
            where: { id: planId },
        });

        revalidatePath('/admin/plans');
        return { success: true };
    } catch (error) {
        console.error('Delete plan error:', error);
        return { error: 'Failed to delete plan' };
    }
}
