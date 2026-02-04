import {
    lemonSqueezySetup,
    createCheckout,
    cancelSubscription,
    getSubscription,
} from '@lemonsqueezy/lemonsqueezy.js';

if (!process.env.LEMON_SQUEEZY_API_KEY) {
    throw new Error('LEMON_SQUEEZY_API_KEY is not set');
}

// Initialize Lemon Squeezy
lemonSqueezySetup({
    apiKey: process.env.LEMON_SQUEEZY_API_KEY,
});

export class LemonSqueezyProvider {
    private storeId: string;

    constructor() {
        this.storeId = process.env.LEMON_SQUEEZY_STORE_ID || '';
        if (!this.storeId) {
            throw new Error('LEMON_SQUEEZY_STORE_ID is not set');
        }
    }

    async createCheckout(variantId: string, email: string) {
        const checkout = await createCheckout(this.storeId, variantId, {
            checkoutData: {
                email,
                custom: {
                    user_id: email,
                },
            },
        });

        return checkout;
    }

    async getSubscription(subscriptionId: string) {
        return await getSubscription(subscriptionId);
    }

    async cancelSubscription(subscriptionId: string) {
        return await cancelSubscription(subscriptionId);
    }

    verifyWebhookSignature(body: string, signature: string): boolean {
        // Implement webhook signature verification
        const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
        if (!secret) {
            throw new Error('LEMON_SQUEEZY_WEBHOOK_SECRET is not set');
        }
        // Add actual verification logic here
        return true;
    }
}
