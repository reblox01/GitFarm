import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});

export class StripeProvider {
    async createCustomer(email: string, name?: string) {
        return await stripe.customers.create({
            email,
            name: name || undefined,
        });
    }

    async createSubscription(customerId: string, priceId: string) {
        return await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
        });
    }

    async cancelSubscription(subscriptionId: string) {
        return await stripe.subscriptions.cancel(subscriptionId);
    }

    async createCheckoutSession(params: {
        customerId: string;
        priceId: string;
        mode: 'subscription' | 'payment';
        successUrl: string;
        cancelUrl: string;
        metadata?: Record<string, string>;
    }) {
        return await stripe.checkout.sessions.create({
            customer: params.customerId,
            line_items: [{ price: params.priceId, quantity: 1 }],
            mode: params.mode,
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            metadata: params.metadata,
        });
    }

    async constructWebhookEvent(body: string, signature: string) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not set');
        }
        return stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
}
