'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/payments/stripe';
import { revalidatePath } from 'next/cache';

export async function syncStripeCredits() {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true }
    });

    if (!user?.stripeCustomerId) return { error: 'No Stripe customer found' };

    // 1. Check for paid checkout sessions
    const sessions = await stripe.checkout.sessions.list({
        customer: user.stripeCustomerId,
        limit: 5,
    });

    console.log(`[Stripe Sync] Found ${sessions.data.length} sessions for customer ${user.stripeCustomerId}`);

    const paidSession = (sessions.data as any[]).find((s: any) => s.payment_status === 'paid');

    if (paidSession) {
        console.log(`[Stripe Sync] Found paid session: ${paidSession.id}`);
        const planId = paidSession.metadata?.planId;

        if (planId) {
            const plan = await prisma.plan.findUnique({ where: { id: planId } });
            if (plan) {
                await updateCreditsAndSubscription(session.user.id, plan, paidSession.subscription as string);
                return { success: true, message: `Synced credits from session: ${plan.credits} added!` };
            }
        }
    }

    // 2. Fallback: Check for paid invoices (for recurring subs)
    const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        status: 'paid',
        limit: 5,
    });

    console.log(`[Stripe Sync] Found ${invoices.data.length} paid invoices`);

    for (const item of invoices.data) {
        const invoice = item as any;
        // Try to find a plan by the line items
        const lineItem = invoice.lines.data[0];
        if (lineItem?.price?.id) {
            const plan = await prisma.plan.findFirst({
                where: { stripeProductId: lineItem.price.id }
            });

            if (plan) {
                console.log(`[Stripe Sync] Found plan via invoice: ${plan.name}`);
                await updateCreditsAndSubscription(session.user.id, plan, invoice.subscription as string);
                return { success: true, message: `Synced credits from invoice: ${plan.credits} added!` };
            }
        }
    }

    return { error: 'No successful payments or active plans found in Stripe. If you just paid, wait 10 seconds and refresh.' };
}

async function updateCreditsAndSubscription(userId: string, plan: any, subscriptionId: string | null) {
    // Check if we already have this subscription active to avoid double credits on refresh
    const existing = await prisma.userSubscription.findUnique({
        where: { userId }
    });

    // If it's a sub and it's already recorded, don't re-grant credits unless we want to allow it
    if (existing?.planId === plan.id && existing?.status === 'ACTIVE' && plan.type === 'MONTHLY') {
        console.log(`[Stripe Sync] Plan already active for user ${userId}, skipping credit grant`);
        return;
    }

    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: plan.credits } }
        }),
        prisma.userSubscription.upsert({
            where: { userId },
            update: {
                planId: plan.id,
                status: 'ACTIVE',
                providerSubscriptionId: subscriptionId
            },
            create: {
                userId,
                planId: plan.id,
                status: 'ACTIVE',
                provider: 'STRIPE',
                providerSubscriptionId: subscriptionId
            }
        })
    ]);

    revalidatePath('/dashboard');
}
