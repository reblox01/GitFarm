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
    // A user is "Pro" if they have or had any paid plan
    const isPro = subscription && subscription.plan.price > 0;
    const currentPlanId = subscription?.planId;
    const isMonthlyActive = isPro && subscription.plan.type === 'MONTHLY' && subscription.status === 'ACTIVE';

    const handleDisabledClick = () => {
        toast.error("You must cancel your active monthly subscription before switching plans.");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            {plans.map((plan: any) => {
                const isCurrentPlan = currentPlanId === plan.id;
                const isMonthly = plan.type === 'MONTHLY';
                const isFree = plan.price === 0 || plan.isDefault;

                // Recommendation: Monthly plans are always recommended
                const isRecommended = isMonthly;

                // Disable logic:
                // 1. If user is Pro, the "Free" plan is completely disabled/non-selectable
                // 2. If user has an ACTIVE MONTHLY sub, they can't switch/recharge other things without cancelling first (standard sub logic)
                // 3. One-time plans are NEVER "disabled" if they are the current plan (they become "Recharge")

                let buttonLabel = 'Get Started';
                let isDisabled = false;
                let showCheckout = true;

                if (isFree) {
                    if (isPro) {
                        buttonLabel = 'Free Forever (Pro Member)';
                        isDisabled = true;
                        showCheckout = false;
                    } else if (isCurrentPlan || !currentPlanId) {
                        buttonLabel = 'Current Plan';
                        isDisabled = true;
                        showCheckout = false;
                    }
                } else {
                    if (isMonthly) {
                        if (isCurrentPlan && isMonthlyActive) {
                            buttonLabel = 'Current Plan';
                            isDisabled = true;
                            showCheckout = false;
                        } else if (isMonthlyActive && !isCurrentPlan) {
                            // Already have another monthly sub active
                            isDisabled = true;
                            showCheckout = false;
                        }
                    } else {
                        // One-time plan
                        if (isCurrentPlan) {
                            buttonLabel = 'Recharge Credits';
                        } else if (isMonthlyActive) {
                            // Can't buy one-time while monthly is active? 
                            // User didn't specify, but usually you can buy top-ups.
                            // However, current logic blocks switching.
                            // Let's allow one-time purchase as top-up even if monthly is active?
                            // Actually, many systems allow "Addons". 
                            // User said: "always in that even if credits end he still marked as pro"
                            buttonLabel = 'Upgrade';
                        }
                    }
                }

                return (
                    <Card key={plan.id} className={`relative flex flex-col transition-all duration-300 ${isRecommended ? 'border-primary shadow-lg scale-105 z-10' : 'border-border hover:border-muted-foreground/50'}`}>
                        {isRecommended && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <Badge className="bg-primary text-primary-foreground px-3 py-1 animate-pulse">
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
                            {!showCheckout ? (
                                <Button className="w-full" variant={isCurrentPlan ? "outline" : "secondary"} disabled={isDisabled} onClick={isDisabled && !isCurrentPlan ? handleDisabledClick : undefined}>
                                    {buttonLabel}
                                </Button>
                            ) : (
                                <PlanCheckoutButton planId={plan.id} price={plan.price} label={buttonLabel} />
                            )}
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
