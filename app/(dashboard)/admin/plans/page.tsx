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
import { Plus } from 'lucide-react';
import { PlanDialog } from '@/components/admin/plan-dialog';

export default async function AdminPlansPage() {
    const session = await auth();

    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        redirect('/dashboard');
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Plans</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage subscription tiers and pricing
                    </p>
                </div>
                <PlanDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Plans</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stripe ID</TableHead>
                                <TableHead>Subscribers</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No plans created yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                plans.map((plan: any) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-medium">
                                            {plan.name}
                                            {plan.isDefault && (
                                                <Badge variant="secondary" className="ml-2">Default</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>${(plan.price / 100).toFixed(2)}</TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {plan.stripeProductId || '-'}
                                        </TableCell>
                                        <TableCell>{plan._count.subscriptions}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">Active</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
