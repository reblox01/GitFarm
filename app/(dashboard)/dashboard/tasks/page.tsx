import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Pause, Play, Trash2 } from 'lucide-react';
import Link from 'next/link';
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
                    {tasks.map((task) => (
                        <Card key={task.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{task.name}</CardTitle>
                                        <CardDescription>
                                            Schedule: {task.schedule}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                // TODO: Implement toggle
                                            }}
                                        >
                                            {task.active ? (
                                                <>
                                                    <Pause className="h-4 w-4 mr-1" />
                                                    Pause
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="h-4 w-4 mr-1" />
                                                    Resume
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                // TODO: Implement delete
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`h-2 w-2 rounded-full ${task.active ? 'bg-green-500' : 'bg-gray-400'
                                            }`}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {task.active ? 'Active' : 'Paused'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
