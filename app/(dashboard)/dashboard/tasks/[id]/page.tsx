import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCronSchedule } from '@/lib/utils';
import { redirect, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GitBranch, Coins, History, Calendar, Edit2, Play } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskLogsList } from '@/components/tasks/task-logs-list';
import { format } from 'date-fns';

export default async function TaskDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const task = await prisma.task.findUnique({
        where: { id: params.id },
        include: {
            logs: {
                orderBy: { timestamp: 'desc' },
                take: 30
            }
        }
    });

    if (!task || task.userId !== session.user.id) {
        notFound();
    }

    const repos = (task.repositories as any[]) || [];
    const creditsUsed = task.creditsUsed;
    const creditLimit = task.creditLimit;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/tasks">
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {task.name}
                            <Badge variant={task.active ? "default" : "secondary"}>
                                {task.active ? 'Active' : 'Paused'}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Task execution history and configuration
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/dashboard/tasks/${task.id}/edit`}>
                        <Button variant="outline">
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Task
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Task Stats & Config */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    Schedule
                                </span>
                                <span className="text-sm font-medium">{formatCronSchedule(task.schedule)}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <GitBranch className="h-4 w-4" />
                                    Repositories
                                </span>
                                <span className="text-sm font-medium">{repos.length}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <LayoutGrid className="h-4 w-4" />
                                    Distribution
                                </span>
                                <Badge variant="outline" className="text-[10px] uppercase">
                                    {task.distribution}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Coins className="h-4 w-4" />
                                    Credits Used
                                </span>
                                <span className="text-sm font-medium">{creditsUsed}</span>
                            </div>
                            {creditLimit && (
                                <div className="flex items-center justify-between py-2 border-b">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <XCircle className="h-4 w-4" />
                                        Stop When...
                                    </span>
                                    <span className="text-sm font-medium">{creditLimit} credits</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Created At
                                </span>
                                <span className="text-sm font-medium">
                                    {format(new Date(task.createdAt), 'MMM d, yyyy')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Target Repositories</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {repos.map((r: any) => (
                                    <div key={r.fullName} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border text-sm font-mono">
                                        <div className="flex items-center gap-2 truncate">
                                            <GitBranch className="h-3 w-3 text-muted-foreground" />
                                            <span className="truncate">{r.fullName}</span>
                                        </div>
                                        {task.distribution === 'EQUAL' && r.commits && (
                                            <Badge variant="secondary" className="font-sans shrink-0 ml-2">
                                                {r.commits} commits
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Execution Timeline */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Execution Timeline
                                <History className="h-5 w-5 text-muted-foreground" />
                            </CardTitle>
                            <CardDescription>
                                Detailed history of automated commits and task status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TaskLogsList taskId={task.id} initialLogs={task.logs as any} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function LayoutGrid({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
    )
}

function XCircle({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </svg>
    )
}
