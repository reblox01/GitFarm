'use client';

import { useState, useEffect } from 'react';

import { format } from 'date-fns';
import { CheckCircle2, XCircle, GitBranch, Coins, ChevronDown, ChevronRight, Loader2, CircleDashed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface TaskLogStep {
    step: string;
    status: 'running' | 'done' | 'error';
    timestamp: string;
}

interface TaskLog {
    id: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'RUNNING';
    message: string | null;
    commitsCount: number;
    creditsDeducted: number;
    repository: string | null;
    timestamp: Date;
    details?: TaskLogStep[];
}

interface TaskLogsListProps {
    taskId: string;
    initialLogs: TaskLog[];
}

export function TaskLogsList({ taskId, initialLogs }: TaskLogsListProps) {
    const [logs, setLogs] = useState<TaskLog[]>(initialLogs);

    useEffect(() => {
        setLogs(initialLogs);
    }, [initialLogs]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/tasks/${taskId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.task && data.task.logs) {
                        setLogs(data.task.logs);
                    }
                }
            } catch (error) {
                console.error('Failed to poll logs:', error);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [taskId]);

    if (logs.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
                <p className="text-muted-foreground">No execution logs found yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => (
                <LogItem key={log.id} log={log} />
            ))}
        </div>
    );
}

function LogItem({ log }: { log: TaskLog }) {
    const [isOpen, setIsOpen] = useState(log.status === 'RUNNING');

    useEffect(() => {
        if (log.status === 'RUNNING') setIsOpen(true);
    }, [log.status]);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg bg-card transition-all hover:bg-muted/5">
            <CollapsibleTrigger asChild>
                <div className="flex items-start gap-4 p-4 cursor-pointer">
                    <div className="mt-1">
                        {log.status === 'SUCCESS' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : log.status === 'FAILED' ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                                <Badge variant={
                                    log.status === 'SUCCESS' ? "default" :
                                        log.status === 'FAILED' ? "destructive" :
                                            "secondary"
                                } className={cn("h-5", log.status === 'RUNNING' && "animate-pulse")}>
                                    {log.status === 'SUCCESS' ? 'Success' :
                                        log.status === 'FAILED' ? 'Failed' :
                                            log.status === 'RUNNING' ? 'Running' : 'Pending'}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                    {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                {log.repository && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <GitBranch className="h-3 w-3" />
                                        <span className="truncate max-w-[150px]">{log.repository.split('/')[1] || log.repository}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Coins className="h-3 w-3" />
                                    <span>{log.creditsDeducted} credits</span>
                                </div>
                                {log.details && log.details.length > 0 && (
                                    <div className="text-muted-foreground">
                                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </div>
                                )}
                            </div>
                        </div>

                        {log.message && (
                            <p className="text-sm text-foreground/80 mb-1 leading-relaxed">
                                {log.message}
                            </p>
                        )}
                    </div>
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="px-4 pb-4 pl-12 space-y-2">
                    {log.details?.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                            <div className={cn(
                                "h-2 w-2 rounded-full",
                                step.status === 'done' ? "bg-green-500/50" :
                                    step.status === 'running' ? "bg-blue-500 animate-pulse" :
                                        "bg-red-500"
                            )} />
                            <span className={cn(
                                "flex-1",
                                step.status === 'running' && "font-medium text-foreground",
                                step.status === 'done' && "text-muted-foreground line-through decoration-transparent",
                                step.status === 'error' && "text-destructive"
                            )}>
                                {step.step}
                            </span>
                            {step.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                        </div>
                    ))}
                    {log.details && log.details.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">Initializing...</p>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
