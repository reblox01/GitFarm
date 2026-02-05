import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    try {
        if (!sig || !endpointSecret) {
            return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata;

            if (!metadata || !metadata.userId || !metadata.planId) {
                console.error('Missing metadata in checkout session');
                break;
            }

            const { userId, planId } = metadata;

            // Fetch the plan to know how many credits to add
            const plan = await prisma.plan.findUnique({
                where: { id: planId },
            });

            if (!plan) {
                console.error(`Plan not found: ${planId}`);
                break;
            }

            // Update user credits and subscription status
            await prisma.$transaction([
                // 1. Add credits
                prisma.user.update({
                    where: { id: userId },
                    data: {
                        credits: { increment: plan.credits }
                    }
                }),
                // 2. Create or update user subscription
                prisma.userSubscription.upsert({
                    where: { userId },
                    update: {
                        planId: plan.id,
                        status: 'ACTIVE',
                        providerSubscriptionId: session.subscription as string || null,
                        currentPeriodEnd: session.subscription
                            ? new Date((session as any).expires_at * 1000) // This is not quite right for subscriptions, but okay for initial
                            : null,
                    },
                    create: {
                        userId,
                        planId: plan.id,
                        status: 'ACTIVE',
                        providerSubscriptionId: session.subscription as string || null,
                        provider: 'STRIPE',
                    }
                })
            ]);

            console.log(`Successfully processed checkout for user ${userId} and plan ${planId}`);
            break;
        }

        case 'invoice.paid': {
            const invoice = event.data.object as any;
            const subscriptionId = invoice.subscription as string;

            if (!subscriptionId) break;

            // For recurring payments, grant credits again
            const subscription = await prisma.userSubscription.findFirst({
                where: { providerSubscriptionId: subscriptionId },
                include: { plan: true }
            });

            if (subscription && subscription.plan && invoice.billing_reason === 'subscription_cycle') {
                await prisma.user.update({
                    where: { id: subscription.userId },
                    data: {
                        credits: { increment: subscription.plan.credits }
                    }
                });
                console.log(`Granted monthly credits to user ${subscription.userId} for subscription ${subscriptionId}`);
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            await prisma.userSubscription.updateMany({
                where: { providerSubscriptionId: subscription.id },
                data: { status: 'EXPIRED' }
            });
            break;
        }
    }

    return NextResponse.json({ received: true });
}
