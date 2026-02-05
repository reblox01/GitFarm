import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { TaskItem } from '@/components/tasks/task-item';
import { redirect } from 'next/navigation';

export default async function TasksPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            subscription: {
                include: {
                    plan: {
                        include: {
                            features: {
                                include: {
                                    feature: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const tasks = await prisma.task.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
    });

    const canUseTasks = user?.subscription?.plan.features.some(f => f.feature.key === 'daily_tasks');
    const taskLimit = user?.subscription?.plan.features.find(f => f.feature.key === 'daily_tasks')?.limitValue;

    if (!canUseTasks) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Automated Tasks</h1>
                    <p className="text-muted-foreground mt-2">
                        Schedule recurring commits to maintain your streak
                    </p>
                </div>

                <Card className="border-dashed border-2 bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Automated Tasks is a Pro Feature</h3>
                        <p className="text-muted-foreground max-w-sm mb-8">
                            Your current plan doesn't include automated tasks. Upgrade to Pro to keep your GitHub streak alive while you sleep!
                        </p>
                        <Link href="/dashboard/plans">
                            <Button size="lg" className="rounded-full px-8">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Upgrade to Pro
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Automated Tasks</h1>
                    <p className="text-muted-foreground mt-2">
                        Schedule recurring commits to maintain your streak
                        {taskLimit && <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">Limit: {tasks.length}/{taskLimit}</span>}
                    </p>
                </div>
                {(!taskLimit || tasks.length < taskLimit) && (
                    <Link href="/dashboard/tasks/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Task
                        </Button>
                    </Link>
                )}
            </div>

            {tasks.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Clock className="h-16 w-16 text-muted-foreground/20 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Create your first automated task to get started
                        </p>
                        <Link href="/dashboard/tasks/new">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Task
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {tasks.map((task: any) => (
                        <TaskItem key={task.id} task={task} />
                    ))}
                </div>
            )}
        </div>
    );
}
