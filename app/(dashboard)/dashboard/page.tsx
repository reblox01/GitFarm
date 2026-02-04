import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, GitCommit, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
    const session = await auth();

    // Fetch user stats
    if (!session?.user?.id) {
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
            <div>
                <h1 className="text-3xl font-bold">Welcome back, {session?.user.name}! 👋</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your GitHub contributions and automation tasks
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
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
            <Card>
                <CardHeader>
                    <CardTitle>Recent Commit Jobs</CardTitle>
                    <CardDescription>
                        {user?.commitJobs.length ? 'Your latest commit generations' : 'No commit jobs yet'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {user?.commitJobs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <GitCommit className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No commit jobs yet. Create your first pattern!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {user?.commitJobs.map((job) => (
                                <div key={job.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                    <div>
                                        <p className="font-medium">
                                            {job.completedCommits} / {job.totalCommits} commits
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        job.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                                            job.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {job.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
