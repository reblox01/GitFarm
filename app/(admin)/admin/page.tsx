import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, Flag, Settings } from 'lucide-react';
import { prisma } from '@/lib/db';

export default async function AdminPage() {
    // Fetch admin stats
    const [totalUsers, activeSubscriptions, totalPlans, totalFeatures] = await Promise.all([
        prisma.user.count(),
        prisma.userSubscription.count({ where: { status: 'ACTIVE' } }),
        prisma.plan.count(),
        prisma.feature.count(),
    ]);

    const stats = [
        {
            title: 'Total Users',
            value: totalUsers,
            description: 'Registered users',
            icon: Users,
            href: '/admin/users',
        },
        {
            title: 'Active Subscriptions',
            value: activeSubscriptions,
            description: 'Paying customers',
            icon: CreditCard,
            href: '/admin/subscriptions',
        },
        {
            title: 'Plans',
            value: totalPlans,
            description: 'Subscription tiers',
            icon: Flag,
            href: '/admin/plans',
        },
        {
            title: 'Features',
            value: totalFeatures,
            description: 'Available features',
            icon: Flag,
            href: '/admin/features',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Overview</h2>
                <p className="text-muted-foreground mt-2">
                    Monitor and manage your GitFarm platform
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.title} href={stat.href}>
                            <Card className="hover:border-primary transition-colors cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href="/admin/users">
                            <div className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5" />
                                    <div>
                                        <p className="font-medium">Manage Users</p>
                                        <p className="text-sm text-muted-foreground">View and edit user accounts</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <Link href="/admin/plans">
                            <div className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5" />
                                    <div>
                                        <p className="font-medium">Manage Plans</p>
                                        <p className="text-sm text-muted-foreground">Create and edit subscription plans</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <Link href="/admin/settings">
                            <div className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <Settings className="h-5 w-5" />
                                    <div>
                                        <p className="font-medium">Site Settings</p>
                                        <p className="text-sm text-muted-foreground">Configure payment providers and more</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest platform events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Activity log coming soon...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
