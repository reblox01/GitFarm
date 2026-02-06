'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function cancelSubscription() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        const subscription = await prisma.userSubscription.findUnique({
            where: { userId: session.user.id },
        });

        if (!subscription || subscription.status !== 'ACTIVE') {
            return { error: 'No active subscription found' };
        }

        // In a real app, you would call Stripe/LemonSqueezy API here to cancel.
        // For now, we just update the local DB.

        await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
                status: 'CANCELED',
                // currentPeriodEnd matches what Stripe usually sends
            }
        });

        revalidatePath('/dashboard/settings');
        return { success: true, message: 'Subscription canceled. It will remain active until the end of the period.' };
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return { error: 'Failed to cancel subscription' };
    }
}
