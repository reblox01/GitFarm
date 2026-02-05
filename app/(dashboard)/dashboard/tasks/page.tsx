import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock } from 'lucide-react';
import Link from 'next/link';
import { TaskItem } from '@/components/tasks/task-item';
import { redirect } from 'next/navigation';

export default async function TasksPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const tasks = await prisma.task.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Automated Tasks</h1>
                    <p className="text-muted-foreground mt-2">
                        Schedule recurring commits to maintain your streak
                    </p>
                </div>
                <Link href="/dashboard/tasks/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Task
                    </Button>
                </Link>
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
