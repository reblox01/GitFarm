import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign } from 'lucide-react';

export default async function AdminPlansPage() {
    const plans = await prisma.plan.findMany({
        include: {
            features: {
                include: {
                    feature: true,
                },
            },
            _count: {
                select: {
                    subscriptions: true,
                },
            },
        },
        orderBy: { price: 'asc' },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Subscription Plans</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage subscription tiers and features
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Plan
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.id} className={plan.isDefault ? 'border-2 border-green-500' : ''}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle>{plan.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-2">
                                        <DollarSign className="h-4 w-4" />
                                        {(plan.price / 100).toFixed(2)} / month
                                    </CardDescription>
                                </div>
                                {plan.isDefault && (
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                                        Default
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Features:</p>
                                <ul className="space-y-1">
                                    {plan.features.map((pf) => (
                                        <li key={pf.id} className="text-sm text-muted-foreground">
                                            • {pf.feature.name}: {pf.limitValue ?? 'Unlimited'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    {plan._count.subscriptions} active subscriptions
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                    Edit
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                    Features
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
