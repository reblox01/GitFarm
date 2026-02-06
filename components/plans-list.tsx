'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Coins, Zap } from 'lucide-react';
import { PlanCheckoutButton } from '@/components/plan-checkout-button';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PlansListProps {
    plans: any[];
    subscription: any;
}

export function PlansList({ plans, subscription }: PlansListProps) {
    // Logic:
    // 1. If user has ACTIVE PAID subscription (price > 0), they cannot subscribe to ANY other plan (Free or Paid) without cancelling first.
    // 2. If user is on Free (or no active paid sub), they can subscribe to Paid.

    const isPaidActive = subscription?.status === 'ACTIVE' && subscription.plan.price > 0;
    const currentPlanId = subscription?.planId;

    const handleDisabledClick = () => {
        toast.error("You must cancel your current active subscription before switching plans.");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            {plans.map((plan: any) => {
                const isCurrentPlan = currentPlanId === plan.id || (!isPaidActive && plan.isDefault && !currentPlanId);
                const isFree = plan.price === 0 || plan.isDefault;

                // Disable if:
                // - Already on this plan (Current)
                // - Has paid active subscription AND this is a different plan
                const isDisabled = isCurrentPlan || isPaidActive;

                return (
                    <Card key={plan.id} className={`relative flex flex-col ${plan.isDefault ? 'border-primary shadow-lg scale-105 z-10' : 'border-border'}`}>
                        {plan.isDefault && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                                    Recommended
                                </Badge>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <CardDescription>
                                {plan.type === 'MONTHLY' ? 'Billed monthly' : 'One-time purchase'}
                            </CardDescription>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-4xl font-bold">${(plan.price / 100).toFixed(2)}</span>
                                {plan.type === 'MONTHLY' && (
                                    <span className="text-muted-foreground">/mo</span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-6">
                            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg text-green-600 dark:text-green-500 border border-green-500/20">
                                <Coins className="size-5" />
                                <span className="font-bold">{plan.credits.toLocaleString()} Credits Included</span>
                            </div>

                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2">
                                    <Check className="size-4 text-green-500 shrink-0" />
                                    <span>{plan.credits} automated commits</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="size-4 text-green-500 shrink-0" />
                                    <span>Custom patterns & schedules</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="size-4 text-green-500 shrink-0" />
                                    <span>24/7 background processing</span>
                                </li>
                                {plan.price > 0 && (
                                    <li className="flex items-center gap-2 font-medium">
                                        <Zap className="size-4 text-amber-500 shrink-0" />
                                        <span>Priority generation queue</span>
                                    </li>
                                )}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            {isCurrentPlan ? (
                                <Button className="w-full" variant="outline" disabled>
                                    Current Plan
                                </Button>
                            ) : isDisabled ? (
                                <Button className="w-full" variant="secondary" onClick={handleDisabledClick}>
                                    Switch Plan
                                </Button>
                            ) : (
                                <PlanCheckoutButton planId={plan.id} price={plan.price} />
                            )}
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
