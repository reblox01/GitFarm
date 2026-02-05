'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { syncStripeCredits } from '@/app/actions/stripe-sync';

export function CheckoutStatus() {
    const searchParams = useSearchParams();
    const status = searchParams.get('checkout');

    useEffect(() => {
        if (status === 'success') {
            const sync = async () => {
                const promise = syncStripeCredits();
                toast.promise(promise, {
                    loading: 'Syncing your credits...',
                    success: (data) => data.message || 'Credits updated!',
                    error: 'Failed to sync. Please refresh.',
                });
                await promise;
            };

            sync();
            window.history.replaceState({}, '', '/dashboard');
        } else if (status === 'cancel') {
            toast.error('Payment cancelled', {
                description: 'You haven\'t been charged.',
            });
            window.history.replaceState({}, '', '/dashboard');
        }
    }, [status]);

    return null;
}
