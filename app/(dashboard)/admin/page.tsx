import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, Activity, GitCommit, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, subMonths, startOfMonth } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default async function AdminPage() {
    const session = await auth();

    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        redirect('/dashboard');
    }

    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(lastMonth);

    // Fetch stats
    const [
        userCount,
        lastMonthUserCount,
        subCount,
        taskCount,
        commitStats,
        recentUsers,
        recentActivity
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { lt: startOfCurrentMonth } } }),
        prisma.userSubscription.count({
            where: {
                status: 'ACTIVE',
                plan: {
                    price: { gt: 0 }
                }
            }
        }),
        prisma.task.count({ where: { active: true } }),
        prisma.commitJob.aggregate({
            _sum: {
                completedCommits: true
            }
        }),
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
        }),
        prisma.commitJob.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        })
    ]);

    const totalCommits = commitStats._sum.completedCommits || 0;
    const userGrowth = lastMonthUserCount > 0
        ? ((userCount - lastMonthUserCount) / lastMonthUserCount) * 100
        : 100;

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
                        <p className={`text-xs ${userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {userGrowth >= 0 ? '+' : ''}{userGrowth.toFixed(1)}% from last month
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
                            {userCount > 0 ? ((subCount / userCount) * 100).toFixed(1) : 0}% conversion rate
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
                        <div className="text-2xl font-bold">{totalCommits.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Generated across all users
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Signups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentUsers.length > 0 ? (recentUsers as any[]).map((user: any) => (
                                <div key={user.id} className="flex items-center gap-4">
                                    <Avatar className="h-9 w-9 shrink-0">
                                        <AvatarImage src={user.avatarUrl || ''} alt={user.name || ''} />
                                        <AvatarFallback>{(user.name || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none truncate">{user.name || 'Anonymous'}</p>
                                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                    <div className="shrink-0 font-medium text-xs text-muted-foreground">
                                        {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-sm">No recent signups to display.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentActivity.length > 0 ? (recentActivity as any[]).map((job: any) => (
                                <div key={job.id} className="flex items-start gap-4">
                                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${job.status === 'COMPLETED' ? 'bg-green-500' :
                                        job.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-500'
                                        }`} />
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none truncate">
                                            {job.user.name || job.user.email}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {job.status === 'COMPLETED' ? 'Generated' : 'Failed to generate'} {job.totalCommits} commits
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(job.createdAt, { addSuffix: true })}
                                        </p>
                                    </div>
                                    <div className="shrink-0">
                                        {job.status === 'COMPLETED' ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : job.status === 'FAILED' ? (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        ) : (
                                            <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-sm">No recent activity.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
