'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/payments/stripe';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkRateLimit, apiLimiter } from '@/lib/rate-limit';

const CheckoutSchema = z.object({
    planId: z.string().cuid(),
});

export async function createCheckoutSession(planId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const validated = CheckoutSchema.parse({ planId });
    const userId = session.user.id;

    // Rate limiting (per user)
    const { success } = await checkRateLimit(apiLimiter, `checkout:${userId}`);
    if (!success) {
        throw new Error('Too many checkout attempts. Please wait.');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            email: true,
            name: true,
            stripeCustomerId: true,
        }
    });
    if (!user) {
        throw new Error('User not found');
    }

    const plan = await prisma.plan.findUnique({
        where: { id: validated.planId },
    });

    if (!plan) {
        throw new Error('Plan not found');
    }

    if (!plan.stripeProductId) {
        throw new Error('Plan not connected to Stripe');
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.name || undefined,
            metadata: {
                userId,
            }
        });
        customerId = customer.id;
        await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId }
        });
    }

    let stripePriceId = plan.stripeProductId;

    // If the provided ID is a Product ID (starts with prod_), fetch its default price
    if (stripePriceId.startsWith('prod_')) {
        const product = await stripe.products.retrieve(stripePriceId);
        if (!product.default_price) {
            throw new Error('This product has no default price set in Stripe');
        }
        stripePriceId = typeof product.default_price === 'string'
            ? product.default_price
            : product.default_price.id;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
            {
                price: stripePriceId,
                quantity: 1,
            },
        ],
        mode: plan.type === 'MONTHLY' ? 'subscription' : 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/plans?checkout=cancel`,
        metadata: {
            userId,
            planId: validated.planId,
            type: plan.type,
        },
    });

    if (!checkoutSession.url) {
        throw new Error('Failed to create checkout session');
    }

    return { url: checkoutSession.url };
}
