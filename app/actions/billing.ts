'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function cancelSubscription() {
    // ... existed code ...
}

export async function checkAndGrantMonthlyCredits(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscription: {
                    include: {
                        plan: true
                    }
                }
            }
        });

        if (!user || !user.subscription || user.subscription.plan.type !== 'MONTHLY') {
            return { success: false, reason: 'No monthly plan' };
        }

        const plan = user.subscription.plan;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Check if we should grant credits
        // Case 1: Never granted before
        // Case 2: Last grant was > 30 days ago
        if (!user.lastCreditGrant || user.lastCreditGrant < thirtyDaysAgo) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    credits: plan.credits, // Set to monthly allowance
                    lastCreditGrant: now
                }
            });
            return { success: true, granted: plan.credits };
        }

        return { success: false, reason: 'Already granted recently' };
    } catch (error) {
        console.error('Credit refill error:', error);
        return { error: 'Failed to refill credits' };
    }
}
