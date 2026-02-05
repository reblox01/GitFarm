'use client';

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ProgressStep = 'idle' | 'init' | 'needs_init' | 'creating' | 'pushing' | 'complete' | 'error';

interface CommitProgressDialogProps {
    isOpen: boolean;
    step: ProgressStep;
    progress: { current: number; total: number };
    message?: string;
    onClose: () => void;
    actionLabel?: string;
    onAction?: () => void;
}

export function CommitProgressDialog({ isOpen, step, progress, message, onClose, actionLabel, onAction }: CommitProgressDialogProps) {
    // Calculate percentage
    // If pushing, we are effectively 100% of creation, maybe show 100 or indeterminate?
    // Let's stick to creation progress.
    const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Generating Contributions</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please wait while we populate your contribution graph.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-6 py-4">
                    {/* Status Icon & Text */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        {step === 'error' ? (
                            <AlertCircle className="h-10 w-10 text-destructive" />
                        ) : step === 'needs_init' ? (
                            <Sparkles className="h-10 w-10 text-yellow-500" />
                        ) : step === 'complete' ? (
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        ) : (
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        )}

                        <div className="text-center space-y-1">
                            <p className="font-medium text-lg">
                                {step === 'init' && "Initializing..."}
                                {step === 'needs_init' && "Initialization Required"}
                                {step === 'creating' && "Creating Commits"}
                                {step === 'pushing' && "Pushing Changes"}
                                {step === 'complete' && "Success!"}
                                {step === 'error' && "Error Occurred"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {step === 'init' && "Verifying repository access..."}
                                {step === 'needs_init' && (message || "repository needs to be initialized first.")}
                                {step === 'creating' && `Processed ${progress.current} of ${progress.total} commits`}
                                {step === 'pushing' && "Syncing with GitHub..."}
                                {step === 'complete' && "Contributions created successfully."}
                                {step === 'error' && (message || "Something went wrong.")}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {(step === 'creating' || step === 'pushing' || step === 'init') && (
                        <div className="space-y-2">
                            <Progress value={percentage} className="h-2" />
                            <p className="text-xs text-right text-muted-foreground">{percentage}%</p>
                        </div>
                    )}
                </div>

                {(step === 'complete' || step === 'error' || step === 'needs_init') && (
                    <AlertDialogFooter>
                        {(step === 'error' || step === 'needs_init') && actionLabel && onAction && (
                            <Button variant="default" onClick={onAction}>
                                {actionLabel}
                            </Button>
                        )}
                        <AlertDialogAction onClick={onClose}>
                            {step === 'complete' ? 'Done' : 'Close'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
}
