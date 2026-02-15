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
    console.log(`[STRIPE_WEBHOOK] Received event: ${event.type} (${event.id})`);

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata;

            console.log(`[STRIPE_WEBHOOK] Checkout Session Metadata:`, JSON.stringify(metadata, null, 2));

            if (!metadata || !metadata.userId || !metadata.planId) {
                console.error('[STRIPE_WEBHOOK] Missing CRITICAL metadata in checkout session. Cannot record payment!', {
                    userId: metadata?.userId,
                    planId: metadata?.planId,
                    session: session.id
                });
                break;
            }

            const { userId, planId } = metadata;

            // Fetch the plan to know how many credits to add
            const plan = await prisma.plan.findUnique({
                where: { id: planId },
            });

            if (!plan) {
                console.error(`[STRIPE_WEBHOOK] Plan NOT FOUND in database: ${planId}. Payment recorded but credits not granted!`);
                // We should still record the payment if possible, or error out
                break;
            }

            // Update user credits and subscription status
            console.log(`[STRIPE_WEBHOOK] Processing transaction: user=${userId}, plan=${planId}, amount=${session.amount_total}`);

            const paymentId = session.payment_intent as string || session.id;

            // Idempotency check: skip if this payment was already processed
            const existingTx = await prisma.paymentTransaction.findFirst({
                where: { providerPaymentId: paymentId }
            });

            if (existingTx) {
                console.log(`[STRIPE_WEBHOOK] Payment ${paymentId} already processed, skipping to avoid double credit grant`);
                break;
            }

            try {
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
                                ? new Date((session as any).expires_at * 1000)
                                : null,
                        },
                        create: {
                            userId,
                            planId: plan.id,
                            status: 'ACTIVE',
                            providerSubscriptionId: session.subscription as string || null,
                            provider: 'STRIPE',
                        }
                    }),
                    // 3. Record payment transaction
                    prisma.paymentTransaction.create({
                        data: {
                            userId,
                            amount: session.amount_total || 0,
                            currency: session.currency || 'usd',
                            status: 'COMPLETED',
                            provider: 'STRIPE',
                            providerPaymentId: paymentId,
                            planId: plan.id,
                            metadata: {
                                subscriptionId: typeof session.subscription === 'string' ? session.subscription : (session.subscription as Stripe.Subscription)?.id,
                                invoiced: false,
                                stripeSessionId: session.id
                            },
                        }
                    })
                ]);
                console.log(`[STRIPE_WEBHOOK] Successfully recorded transaction and granted ${plan.credits} credits to user ${userId}`);
            } catch (txError) {
                console.error('[STRIPE_WEBHOOK] Database transaction FAILED:', txError);
                throw txError;
            }
            break;
        }

        case 'invoice.paid': {
            const invoice = event.data.object as any;
            const subscriptionId = invoice.subscription as string;

            console.log(`[STRIPE_WEBHOOK] Invoice Paid: sub=${subscriptionId}, reason=${invoice.billing_reason}`);

            if (!subscriptionId) break;

            const subscription = await prisma.userSubscription.findFirst({
                where: { providerSubscriptionId: subscriptionId },
                include: { plan: true }
            });

            if (subscription && subscription.plan && invoice.billing_reason === 'subscription_cycle') {
                const invoicePaymentId = invoice.payment_intent || invoice.id;

                // Idempotency check: skip if this invoice payment was already processed
                const existingInvoiceTx = await prisma.paymentTransaction.findFirst({
                    where: { providerPaymentId: invoicePaymentId }
                });

                if (existingInvoiceTx) {
                    console.log(`[STRIPE_WEBHOOK] Invoice payment ${invoicePaymentId} already processed, skipping`);
                    break;
                }

                console.log(`[STRIPE_WEBHOOK] Recurring subscription cycle detected for user ${subscription.userId}. Granting ${subscription.plan.credits} credits.`);
                try {
                    await prisma.$transaction([
                        prisma.user.update({
                            where: { id: subscription.userId },
                            data: {
                                credits: { increment: subscription.plan.credits }
                            }
                        }),
                        prisma.paymentTransaction.create({
                            data: {
                                userId: subscription.userId,
                                amount: invoice.amount_paid,
                                currency: invoice.currency || 'usd',
                                status: 'COMPLETED',
                                provider: 'STRIPE',
                                providerPaymentId: invoicePaymentId,
                                planId: subscription.plan.id,
                                metadata: {
                                    subscriptionId: subscriptionId,
                                    invoiceId: invoice.id,
                                    billingReason: invoice.billing_reason,
                                },
                            }
                        })
                    ]);
                    console.log(`[STRIPE_WEBHOOK] Successfully processed recurring payment for user ${subscription.userId}`);
                } catch (txError) {
                    console.error('[STRIPE_WEBHOOK] Recurring payment transaction FAILED:', txError);
                }
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
