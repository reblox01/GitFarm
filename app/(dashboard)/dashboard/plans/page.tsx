import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getActivePlans } from '@/app/actions/get-plans';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Coins, Zap } from 'lucide-react';
import { PlanCheckoutButton } from '@/components/plan-checkout-button';

export default async function PlansPage() {
    const session = await auth();
    if (!session) {
        redirect('/login');
    }

    const plans = await getActivePlans();

    return (
        <div className="container mx-auto py-10 max-w-6xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Choose Your Plan</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Select the perfect plan to boost your GitHub contributions.
                    Get more credits and unlock premium features.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                {(plans as any[]).map((plan: any) => (
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
                            <PlanCheckoutButton planId={plan.id} price={plan.price} />
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="mt-16 text-center">
                <p className="text-muted-foreground text-sm">
                    All payments are securely processed by Stripe.
                    Cancel your monthly subscription anytime from your settings.
                </p>
            </div>
        </div>
    );
}
