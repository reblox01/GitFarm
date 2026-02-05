'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/app/actions/checkout';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface PlanCheckoutButtonProps {
    planId: string;
    price: number;
}

export function PlanCheckoutButton({ planId, price }: PlanCheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async () => {
        setIsLoading(true);
        try {
            const { url } = await createCheckoutSession(planId);
            if (url) {
                window.location.href = url;
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Failed to start checkout. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <Button
            className="w-full h-11 text-base font-bold transition-all hover:scale-[1.02]"
            onClick={handleCheckout}
            disabled={isLoading}
            variant={price > 0 ? 'default' : 'outline'}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    {price > 0 ? 'Get Started' : 'Current Plan'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </>
            )}
        </Button>
    );
}
