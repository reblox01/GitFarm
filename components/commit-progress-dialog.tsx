'use client';

import * as React from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle, Sparkles, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

export type ProgressStep = 'idle' | 'init' | 'needs_init' | 'creating' | 'pushing' | 'complete' | 'error';

interface CommitProgressDialogProps {
    isOpen: boolean;
    step: ProgressStep;
    progress: { current: number; total: number };
    message?: string;
    onClose: () => void;
    actionLabel?: string;
    onAction?: () => void;
    isMinimized: boolean;
    onMinimize: (minimized: boolean) => void;
}

export function CommitProgressDialog({
    isOpen,
    step,
    progress,
    message,
    onClose,
    actionLabel,
    onAction,
    isMinimized,
    onMinimize
}: CommitProgressDialogProps) {
    if (!isOpen) return null;

    // Calculate percentage
    const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    // Floating Bubble Component
    if (isMinimized) {
        return (
            <div
                className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-background/80 backdrop-blur-md border border-border p-2 pr-4 rounded-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300 cursor-pointer hover:bg-accent group"
                onClick={() => onMinimize(false)}
            >
                <div className="relative h-10 w-10 flex items-center justify-center">
                    {/* Simplified Spinner for Mini Mode */}
                    {step === 'error' ? (
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    ) : step === 'complete' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    )}
                    {/* Mini Progress Overlay */}
                    {progress.total > 0 && step !== 'complete' && step !== 'error' && (
                        <svg className="absolute inset-0 h-full w-full -rotate-90">
                            <circle
                                cx="20"
                                cy="20"
                                r="18"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="transparent"
                                className="text-muted/20"
                            />
                            <circle
                                cx="20"
                                cy="20"
                                r="18"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 18}
                                strokeDashoffset={2 * Math.PI * 18 * (1 - percentage / 100)}
                                className="text-primary transition-all duration-500"
                            />
                        </svg>
                    )}
                </div>
                <div className="flex flex-col">
                    <p className="text-xs font-semibold">
                        {step === 'init' && "Initializing..."}
                        {step === 'creating' && `Processing... ${percentage}%`}
                        {step === 'pushing' && "Pushing..."}
                        {step === 'complete' && "Success!"}
                        {step === 'error' && "Error!"}
                        {step === 'needs_init' && "Action Needed"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                        {step === 'creating' && `${progress.current}/${progress.total}`}
                        {step === 'pushing' && "GitHub sync"}
                        {step === 'complete' && "Done"}
                        {(step === 'error' || step === 'needs_init') && "Click to view"}
                    </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-3 w-3" />
                </Button>
            </div>
        );
    }

    return (
        <Drawer open={isOpen && !isMinimized} onClose={onClose} dismissible={false}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-lg">
                    <DrawerHeader className="relative">
                        <DrawerTitle>Generating Contributions</DrawerTitle>
                        <DrawerDescription>
                            Please wait while we populate your contribution graph.
                        </DrawerDescription>
                        {/* Minimize Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-4"
                            onClick={() => onMinimize(true)}
                        >
                            <Minimize2 className="h-4 w-4" />
                        </Button>
                    </DrawerHeader>

                    <div className="space-y-6 py-4">
                        {/* Status Icon & Text */}
                        <div className="flex flex-col items-center justify-center space-y-4">
                            {step === 'error' ? (
                                <AlertCircle className="h-12 w-12 text-destructive" />
                            ) : step === 'needs_init' ? (
                                <Sparkles className="h-12 w-12 text-yellow-500" />
                            ) : step === 'complete' ? (
                                <CheckCircle2 className="h-12 w-12 text-green-500" />
                            ) : (
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
                                <p className="text-sm text-muted-foreground px-4">
                                    {step === 'init' && "Verifying repository access..."}
                                    {step === 'needs_init' && (message || "Repository needs to be initialized first.")}
                                    {step === 'creating' && `Processed ${progress.current} of ${progress.total} commits`}
                                    {step === 'pushing' && "Syncing with GitHub..."}
                                    {step === 'complete' && "Contributions created successfully."}
                                    {step === 'error' && (message || "Something went wrong.")}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {(step === 'creating' || step === 'pushing' || step === 'init') && (
                            <div className="space-y-2 px-8">
                                <Progress value={percentage} className="h-2" />
                                <p className="text-xs text-right text-muted-foreground">{percentage}%</p>
                            </div>
                        )}
                    </div>

                    <DrawerFooter className="pb-8">
                        {(step === 'complete' || step === 'error' || step === 'needs_init') && (
                            <div className="flex gap-2 w-full justify-center">
                                {(step === 'error' || step === 'needs_init') && actionLabel && onAction && (
                                    <Button variant="default" className="flex-1 max-w-[200px]" onClick={onAction}>
                                        {actionLabel}
                                    </Button>
                                )}
                                <DrawerClose asChild>
                                    <Button variant="outline" className="flex-1 max-w-[200px]" onClick={onClose}>
                                        {step === 'complete' ? 'Done' : 'Close'}
                                    </Button>
                                </DrawerClose>
                            </div>
                        )}
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
