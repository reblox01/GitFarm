'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function cancelSubscription() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const subscription = await prisma.userSubscription.findUnique({
            where: { userId: session.user.id },
            include: { plan: true }
        });

        if (!subscription || subscription.status !== 'ACTIVE') {
            return { success: false, error: 'No active subscription found' };
        }

        // Only monthly subscriptions can be canceled
        if (subscription.plan.type !== 'MONTHLY') {
            return { success: false, error: 'One-time plans cannot be canceled' };
        }

        // If it's a Stripe subscription, cancel it in Stripe
        if (subscription.provider === 'STRIPE' && subscription.providerSubscriptionId) {
            const { stripe } = await import('@/lib/payments/stripe');
            try {
                // Cancel at period end so they keep access until paid period is over
                await stripe.subscriptions.update(subscription.providerSubscriptionId, {
                    cancel_at_period_end: true,
                });
            } catch (stripeError: any) {
                console.error('Stripe cancellation error:', stripeError);
                // Even if Stripe fails, we should update our DB if the sub is already being cleaned up
                if (stripeError.code === 'resource_missing') {
                    // Stripe sub already gone
                } else {
                    return { success: false, error: 'Failed to cancel subscription with payment provider' };
                }
            }
        }

        // Update database status
        await prisma.userSubscription.update({
            where: { userId: session.user.id },
            data: { status: 'CANCELED' }
        });

        revalidatePath('/dashboard/settings');
        return { success: true, message: 'Subscription canceled successfully. You will have access until the end of the current billing period.' };
    } catch (error) {
        console.error('Cancellation error:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
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
