'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pause, Play, Trash2 } from 'lucide-react';
import { toggleTask, deleteTask } from '@/app/actions/tasks';
import { toast } from 'sonner';
import { useState } from 'react';

interface TaskItemProps {
    task: {
        id: string;
        name: string;
        schedule: string;
        active: boolean;
        repository: string | null;
        lastRun?: Date | null;
    };
}

export function TaskItem({ task }: TaskItemProps) {
    const [loading, setLoading] = useState(false);

    async function handleToggle() {
        setLoading(true);
        const result = await toggleTask(task.id);
        if (result.success) {
            toast.success(task.active ? 'Task paused' : 'Task resumed');
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        setLoading(true);
        const result = await deleteTask(task.id);
        if (result.success) {
            toast.success('Task deleted');
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    }

    return (
        <Card>
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
                            onClick={handleToggle}
                            disabled={loading}
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
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div
                            className={`h-2 w-2 rounded-full ${task.active ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                        />
                        <span className="text-sm text-muted-foreground">
                            {task.active ? 'Active' : 'Paused'}
                        </span>
                    </div>
                    {task.repository && (
                        <p className="text-sm text-muted-foreground">
                            Repository: <span className="font-mono">{task.repository}</span>
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
