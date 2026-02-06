'use client';

import { formatCronSchedule } from '@/lib/utils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pause, Play, Trash2, Edit2, History, GitBranch, Coins, ArrowRight } from 'lucide-react';
import { toggleTask, deleteTask } from '@/app/actions/tasks';
import { toast } from 'sonner';
import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TaskItemProps {
    task: {
        id: string;
        name: string;
        schedule: string;
        active: boolean;
        repositories: any; // Json: { fullName: string }[]
        creditLimit: number | null;
        creditsUsed: number;
        distribution: string;
    };
}

export function TaskItem({ task }: TaskItemProps) {
    const [loading, setLoading] = useState(false);
    const repos = (task.repositories as any[]) || [];
    const usagePercent = task.creditLimit ? (task.creditsUsed / task.creditLimit) * 100 : 0;

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
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle>{task.name}</CardTitle>
                            <Badge variant={task.active ? "default" : "secondary"} className="h-5">
                                {task.active ? 'Active' : 'Paused'}
                            </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                            <History className="h-3 w-3" />
                            Schedule: {formatCronSchedule(task.schedule)}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/dashboard/tasks/${task.id}/edit`}>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleToggle}
                            disabled={loading}
                        >
                            {task.active ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <GitBranch className="h-4 w-4" />
                        <span>{repos.length} Repositories</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Coins className="h-4 w-4" />
                        <span>{task.creditsUsed} Credits Used</span>
                    </div>
                </div>

                {task.creditLimit && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Credit Limit Progress</span>
                            <span>{task.creditsUsed} / {task.creditLimit}</span>
                        </div>
                        <Progress value={usagePercent} className="h-1" />
                    </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex gap-1 overflow-hidden">
                        {repos.slice(0, 2).map((r: any) => (
                            <Badge key={r.fullName} variant="outline" className="text-[10px] font-mono truncate max-w-[130px]">
                                {r.fullName.split('/')[1]}
                                {task.distribution === 'EQUAL' && r.commits && (
                                    <span className="ml-1 text-primary opacity-70">({r.commits})</span>
                                )}
                            </Badge>
                        ))}
                        {repos.length > 2 && (
                            <Badge variant="outline" className="text-[10px]">+{repos.length - 2} more</Badge>
                        )}
                    </div>
                    <Link href={`/dashboard/tasks/${task.id}`} className="text-xs text-primary flex items-center hover:underline">
                        View Logs
                        <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
