import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, GitCommit, Sparkles, TrendingUp, Coins, CheckCircle2, XCircle, Clock, Github, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { CheckoutStatus } from '@/components/checkout-status';
import { Suspense } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default async function DashboardPage() {
    const session = await auth();
    console.log('Dashboard Page Session:', session ? 'Found' : 'Null');

    // Fetch user stats
    if (!session?.user?.id) {
        console.log('Redirecting to login from dashboard');
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
            commitJobs: {
                orderBy: { createdAt: 'desc' },
                take: 5,
            },
            tasks: {
                where: { active: true },
            },
        },
    });

    const stats = [
        {
            title: 'Available Credits',
            value: user?.credits?.toLocaleString() || '0',
            icon: Coins,
            description: 'To be spent',
            color: 'text-green-600'
        },
        {
            title: 'Total Commits',
            value: user?.commitJobs.reduce((acc, job) => acc + job.completedCommits, 0) || 0,
            icon: GitCommit,
            description: 'All time',
        },
        {
            title: 'Active Tasks',
            value: user?.tasks.length || 0,
            icon: Calendar,
            description: 'Scheduled',
        },
        {
            title: 'Current Plan',
            value: user?.subscription?.plan.name || 'Free',
            icon: Sparkles,
            description: user?.subscription?.status || 'Active',
        },
    ];

    return (
        <div className="space-y-8">
            <Suspense>
                <CheckoutStatus />
            </Suspense>
            <div>
                <h1 className="text-3xl font-bold">Welcome back, {session?.user.name}! 👋</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your GitHub contributions and automation tasks
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat: any) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <Icon className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${stat.color || ''}`}>{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Get started with your contribution management
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <Link href="/dashboard/editor">
                        <Button className="w-full" size="lg">
                            <Sparkles className="mr-2 h-5 w-5" />
                            Create Contribution Pattern
                        </Button>
                    </Link>
                    <Link href="/dashboard/tasks">
                        <Button variant="outline" className="w-full" size="lg">
                            <Calendar className="mr-2 h-5 w-5" />
                            Schedule Task
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Recent Jobs */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Commit Jobs</CardTitle>
                            <CardDescription>
                                {user?.commitJobs.length ? 'Your latest generated contribution patterns' : 'No activity recorded yet'}
                            </CardDescription>
                        </div>
                        {user && user.commitJobs.length > 0 && (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/dashboard/history" className="text-xs">
                                    View All
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {!user || user.commitJobs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border-t">
                            <GitCommit className="h-12 w-12 mx-auto mb-4 opacity-10" />
                            <p className="text-sm">No commit jobs yet. Create your first pattern!</p>
                            <Button variant="outline" size="sm" className="mt-4" asChild>
                                <Link href="/dashboard/editor">Open Editor</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y border-t">
                            {user.commitJobs.map((job: any) => (
                                <div key={job.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                            job.status === 'FAILED' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                            }`}>
                                            {job.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4" /> :
                                                job.status === 'FAILED' ? <XCircle className="h-4 w-4" /> :
                                                    <Clock className="h-4 w-4 animate-pulse" />
                                            }
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm">
                                                    {job.completedCommits} Commits
                                                </p>
                                                {job.repositoryUrl && (
                                                    <>
                                                        <span className="text-muted-foreground text-[10px]">/</span>
                                                        <span className="flex items-center text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                                                            <Github className="h-3 w-3 mr-1 opacity-70" />
                                                            {job.repositoryUrl}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center">
                                                <Clock className="h-3 w-3 mr-1 opacity-50" />
                                                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${job.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50' :
                                            job.status === 'RUNNING' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50' :
                                                job.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50' :
                                                    'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                            }`}>
                                            {job.status}
                                        </span>
                                        {job.status === 'COMPLETED' && job.repositoryUrl && (
                                            <a
                                                href={`https://github.com/${job.repositoryUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-foreground hover:text-foreground transition-all hover:scale-110"
                                                title="View on GitHub"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
