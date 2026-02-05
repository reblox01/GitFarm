'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkRateLimit, apiLimiter } from '@/lib/rate-limit';

// Validation Schemas
const PlanLimitSchema = z.object({
    planId: z.string().cuid(),
    featureId: z.string().cuid(),
    limitValue: z.number().int().min(0).nullable(),
});

const ToggleFeatureSchema = z.object({
    planId: z.string().cuid(),
    featureId: z.string().cuid(),
    enabled: z.boolean(),
});

const CreateFeatureSchema = z.object({
    name: z.string().min(2).max(50),
    key: z.string().regex(/^[a-z0-9_]+$/).max(50),
    description: z.string().max(255).optional(),
});

const UserRoleSchema = z.object({
    userId: z.string().cuid(),
    role: z.enum(['USER', 'ADMIN']),
});

const UserIdSchema = z.object({
    userId: z.string().cuid(),
});

const UserCreditsSchema = z.object({
    userId: z.string().cuid(),
    credits: z.number().int().min(0),
});

async function checkAdmin() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    // Rate limiting for admin actions (per admin user)
    const { success } = await checkRateLimit(apiLimiter, `admin:${session.user.id}`);
    if (!success) {
        throw new Error('Too many administrative requests. Please slow down.');
    }

    return session.user.id;
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

    const validated = PlanLimitSchema.parse({ planId, featureId, limitValue });

    await prisma.planFeature.upsert({
        where: {
            planId_featureId: {
                planId: validated.planId,
                featureId: validated.featureId
            }
        },
        update: {
            limitValue: validated.limitValue
        },
        create: {
            planId: validated.planId,
            featureId: validated.featureId,
            limitValue: validated.limitValue
        }
    });

    revalidatePath('/admin/plans');
    return { success: true };
}

export async function togglePlanFeature(planId: string, featureId: string, enabled: boolean) {
    await checkAdmin();

    const validated = ToggleFeatureSchema.parse({ planId, featureId, enabled });

    if (validated.enabled) {
        await prisma.planFeature.upsert({
            where: {
                planId_featureId: {
                    planId: validated.planId,
                    featureId: validated.featureId
                }
            },
            update: {},
            create: {
                planId: validated.planId,
                featureId: validated.featureId,
                limitValue: null // Default to unlimited if just enabling
            }
        });
    } else {
        await prisma.planFeature.deleteMany({
            where: {
                planId: validated.planId,
                featureId: validated.featureId
            }
        });
    }

    revalidatePath('/admin/plans');
    return { success: true };
}

export async function createFeature(name: string, key: string, description?: string) {
    await checkAdmin();

    const validated = CreateFeatureSchema.parse({ name, key, description });

    const feature = await prisma.feature.create({
        data: {
            name: validated.name,
            key: validated.key,
            description: validated.description
        }
    });

    revalidatePath('/admin/plans');
    return { success: true, feature };
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
    await checkAdmin();

    const validated = UserRoleSchema.parse({ userId, role });

    try {
        await prisma.user.update({
            where: { id: validated.userId },
            data: { role: validated.role }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteUser(userId: string) {
    await checkAdmin();

    const validated = UserIdSchema.parse({ userId });

    try {
        await prisma.user.delete({
            where: { id: validated.userId }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateUserCredits(userId: string, credits: number) {
    await checkAdmin();

    const validated = UserCreditsSchema.parse({ userId, credits });

    try {
        await prisma.user.update({
            where: { id: validated.userId },
            data: { credits: validated.credits }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
