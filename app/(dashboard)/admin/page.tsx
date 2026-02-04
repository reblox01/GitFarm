import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, Activity, GitCommit } from 'lucide-react';

export default async function AdminPage() {
    const session = await auth();

    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        redirect('/dashboard');
    }

    // specific stats
    const [userCount, subCount, taskCount] = await Promise.all([
        prisma.user.count(),
        prisma.userSubscription.count({ where: { status: 'ACTIVE' } }),
        prisma.task.count(),
    ]);

    // calculate total commits (mock calculation from pattern or store it)
    // For now we'll just query commit jobs if we used them, but we don't use CommitJob model in the new action yet.
    // We'll placeholder it.
    const totalCommits = 0;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Admin Overview</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userCount}</div>
                        <p className="text-xs text-muted-foreground">
                            +10% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Subscriptions
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{subCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {((subCount / userCount) * 100).toFixed(1)}% conversion rate
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Tasks
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{taskCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Scheduled recurring jobs
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Commits
                        </CardTitle>
                        <GitCommit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCommits}</div>
                        <p className="text-xs text-muted-foreground">
                            Generated across all users
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Signups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">No recent signups to display.</p>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">No recent activity.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
