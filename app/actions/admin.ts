'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }
}

export async function getPlanLimits() {
    await checkAdmin();

    const plans = await prisma.plan.findMany({
        include: {
            features: {
                include: {
                    feature: true
                }
            }
        },
        orderBy: { price: 'asc' }
    });

    const allFeatures = await prisma.feature.findMany();

    return { plans, allFeatures };
}

export async function updatePlanLimit(planId: string, featureId: string, limitValue: number | null) {
    await checkAdmin();

    await prisma.planFeature.upsert({
        where: {
            planId_featureId: {
                planId,
                featureId
            }
        },
        update: {
            limitValue
        },
        create: {
            planId,
            featureId,
            limitValue
        }
    });

    revalidatePath('/admin/plans');
    return { success: true };
}

export async function togglePlanFeature(planId: string, featureId: string, enabled: boolean) {
    await checkAdmin();

    if (enabled) {
        await prisma.planFeature.upsert({
            where: {
                planId_featureId: {
                    planId,
                    featureId
                }
            },
            update: {},
            create: {
                planId,
                featureId,
                limitValue: null // Default to unlimited if just enabling
            }
        });
    } else {
        await prisma.planFeature.deleteMany({
            where: {
                planId,
                featureId
            }
        });
    }

    revalidatePath('/admin/plans');
    return { success: true };
}

export async function createFeature(name: string, key: string, description?: string) {
    await checkAdmin();

    const feature = await prisma.feature.create({
        data: {
            name,
            key,
            description
        }
    });

    revalidatePath('/admin/plans');
    return { success: true, feature };
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
    await checkAdmin();

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteUser(userId: string) {
    await checkAdmin();

    try {
        await prisma.user.delete({
            where: { id: userId }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateUserCredits(userId: string, credits: number) {
    await checkAdmin();

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { credits }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
