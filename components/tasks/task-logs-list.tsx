'use client';

import { format } from 'date-fns';
import { CheckCircle2, XCircle, GitBranch, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TaskLog {
    id: string;
    status: 'SUCCESS' | 'FAILED';
    message: string | null;
    commitsCount: number;
    creditsDeducted: number;
    repository: string | null;
    timestamp: Date;
}

interface TaskLogsListProps {
    logs: TaskLog[];
}

export function TaskLogsList({ logs }: TaskLogsListProps) {
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
                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card hover:bg-muted/5 transition-colors">
                    <div className="mt-1">
                        {log.status === 'SUCCESS' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                                <Badge variant={log.status === 'SUCCESS' ? "default" : "destructive"} className="h-5">
                                    {log.status === 'SUCCESS' ? 'Success' : 'Failed'}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                    {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                {log.repository && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <GitBranch className="h-3 w-3" />
                                        <span className="truncate max-w-[150px]">{log.repository.split('/')[1]}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Coins className="h-3 w-3" />
                                    <span>{log.creditsDeducted} credits</span>
                                </div>
                            </div>
                        </div>

                        {log.message && (
                            <p className="text-sm text-foreground/80 mb-1 leading-relaxed">
                                {log.message}
                            </p>
                        )}

                        {log.commitsCount > 0 && (
                            <p className="text-xs text-muted-foreground italic">
                                Created {log.commitsCount} commit{log.commitsCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
