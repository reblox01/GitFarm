import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings2, Pencil, Coins } from 'lucide-react';
import { PlanDialog } from '@/components/admin/plan-dialog';
import { PlanLimitsManager } from '@/components/admin/plan-limits-manager';

export default async function AdminPlansPage() {
    const session = await auth();

    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        redirect('/dashboard');
    }

    // Ensure some default features exist for management if they don't already
    const featureCount = await prisma.feature.count();
    if (featureCount === 0) {
        await prisma.feature.createMany({
            data: [
                { name: 'Daily Tasks', key: 'daily_tasks', description: 'Maximum active scheduled tasks' },
                { name: 'Commit Limit', key: 'commit_limit', description: 'Maximum commits per generation' },
                { name: 'Custom Patterns', key: 'custom_patterns', description: 'Ability to save custom patterns' },
                { name: 'Private Repos', key: 'private_repos', description: 'Access to private repositories' },
            ]
        });
    }

    const plans = await prisma.plan.findMany({
        orderBy: { price: 'asc' },
        include: {
            _count: {
                select: { subscriptions: true }
            }
        }
    });

    return (
        <div className="space-y-10 min-w-0 w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Subscription Plans</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage pricing tiers and their associated usage limits
                    </p>
                </div>
                <PlanDialog />
            </div>

            <div className="grid gap-8">
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-primary" />
                            Active Tiers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table className="min-w-[900px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tier Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Credits</TableHead>
                                        <TableHead>Stripe ID</TableHead>
                                        <TableHead>Subscribers</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {plans.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                                No plans created yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        plans.map((plan: any) => (
                                            <TableRow key={plan.id}>
                                                <TableCell className="font-medium">
                                                    <div>{plan.name}</div>
                                                    {plan.isDefault && (
                                                        <Badge variant="secondary" className="mt-1">Default</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <Badge variant={plan.type === 'MONTHLY' ? 'default' : 'outline'}>
                                                        {plan.type === 'MONTHLY' ? 'Monthly' : 'One-time'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium whitespace-nowrap">${(plan.price / 100).toFixed(2)}</TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 text-green-600 font-bold">
                                                        <Coins className="h-3.5 w-3.5" />
                                                        {(plan.credits ?? 0).toLocaleString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-[10px] text-muted-foreground">
                                                    <div className="truncate max-w-[120px]">{plan.stripeProductId || '-'}</div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">{plan._count.subscriptions}</TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <PlanDialog
                                                        plan={plan}
                                                        trigger={
                                                            <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Button>
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <PlanLimitsManager />
            </div>
        </div>
    );
}
