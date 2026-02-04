import { StripeProvider } from './stripe';
import { LemonSqueezyProvider } from './lemon-squeezy';
import { prisma } from '../db';

// Import after Prisma generation
type PaymentProvider = 'STRIPE' | 'LEMON_SQUEEZY';

export interface IPaymentProvider {
    createCustomer?: (email: string, name?: string) => Promise<any>;
    createSubscription?: (customerId: string, priceId: string) => Promise<any>;
    createCheckout?: (variantId: string, email: string) => Promise<any>;
    cancelSubscription: (subscriptionId: string) => Promise<any>;
    getSubscription?: (subscriptionId: string) => Promise<any>;
}

export class PaymentProviderFactory {
    private static stripeProvider: StripeProvider | null = null;
    private static lemonProvider: LemonSqueezyProvider | null = null;

    static async getActiveProvider(): Promise<{
        provider: IPaymentProvider;
        type: PaymentProvider;
    }> {
        // Get active payment provider from settings
        const settings = await prisma.siteSettings.findFirst();
        const activeProvider = settings?.paymentProvider || 'STRIPE';

        if (activeProvider === 'STRIPE') {
            if (!this.stripeProvider) {
                this.stripeProvider = new StripeProvider();
            }
            return { provider: this.stripeProvider, type: 'STRIPE' };
        } else {
            if (!this.lemonProvider) {
                this.lemonProvider = new LemonSqueezyProvider();
            }
            return { provider: this.lemonProvider, type: 'LEMON_SQUEEZY' };
        }
    }

    static async updateActiveProvider(provider: PaymentProvider): Promise<void> {
        const settings = await prisma.siteSettings.findFirst();

        if (settings) {
            await prisma.siteSettings.update({
                where: { id: settings.id },
                data: { paymentProvider: provider },
            });
        } else {
            await prisma.siteSettings.create({
                data: { paymentProvider: provider },
            });
        }
    }
}

export { StripeProvider, LemonSqueezyProvider };
