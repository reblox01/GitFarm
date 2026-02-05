'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GitGraph, Trash2, Sparkles, Loader2, GitCommit, Eraser, Brush, PaintBucket, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { getRepoState, createCommitBatch, pushChanges, initializeRepository, recordCommitJob } from '@/app/actions/commits';
import { subDays } from 'date-fns';
import { CommitProgressDialog } from './commit-progress-dialog';
import type { ProgressStep } from './commit-progress-dialog';

interface ContributionDay {
    week: number;
    day: number;
    selected: boolean;
}

interface Repository {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
}

export function ContributionGrid({ initialCredits = 0 }: { initialCredits?: number }) {
    const [credits, setCredits] = useState(initialCredits);
    const [grid, setGrid] = useState<ContributionDay[]>(() => {
        const days = [];
        for (let week = 0; week < 52; week++) {
            for (let day = 0; day < 7; day++) {
                days.push({ week, day, selected: false });
            }
        }
        return days;
    });

    const [isDrawing, setIsDrawing] = useState(false);
    const [drawMode, setDrawMode] = useState<'fill' | 'erase'>('fill');

    // Repository handling
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [selectedRepo, setSelectedRepo] = useState('');
    const [loadingRepos, setLoadingRepos] = useState(true);

    // Progress State
    const [isGenerating, setIsGenerating] = useState(false);
    const [progressStep, setProgressStep] = useState<ProgressStep>('idle');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [isMinimized, setIsMinimized] = useState(false);

    const [repoStats, setRepoStats] = useState<{ commitCount: number } | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        async function fetchRepositories() {
            try {
                const response = await fetch('/api/github/repositories');
                const data = await response.json();
                if (response.ok) {
                    setRepositories(data.repositories || []);
                }
            } catch (error) {
                console.error('Failed to load repositories', error);
                toast.error('Failed to load repositories');
            } finally {
                setLoadingRepos(false);
            }
        }
        fetchRepositories();
    }, []);

    useEffect(() => {
        async function fetchRepoStats() {
            if (!selectedRepo) {
                setRepoStats(null);
                return;
            }

            setLoadingStats(true);
            try {
                const state = await getRepoState(selectedRepo);
                if (state.success) {
                    setRepoStats({ commitCount: state.commitCount || 0 });
                } else {
                    setRepoStats(null);
                }
            } catch (error) {
                console.error('Failed to fetch repo stats', error);
                setRepoStats(null);
            } finally {
                setLoadingStats(false);
            }
        }
        fetchRepoStats();
    }, [selectedRepo]);

    const selectedCount = grid.filter((cell) => cell.selected).length;
    const isOverLimit = selectedCount >= credits && drawMode === 'fill';

    const toggleCell = (week: number, day: number) => {
        setGrid((prev) => {
            const isCurrentlySelected = prev.find(c => c.week === week && c.day === day)?.selected;

            // If trying to select a new cell but already at limit
            if (!isCurrentlySelected && drawMode === 'fill' && selectedCount >= credits) {
                return prev;
            }

            return prev.map((cell) =>
                cell.week === week && cell.day === day
                    ? { ...cell, selected: drawMode === 'fill' }
                    : cell
            );
        });
    };

    const handleMouseDown = (week: number, day: number) => {
        setIsDrawing(true);
        toggleCell(week, day);
    };

    const handleMouseEnter = (week: number, day: number) => {
        if (isDrawing) {
            toggleCell(week, day);
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const clearGrid = () => {
        setGrid((prev) => prev.map((cell) => ({ ...cell, selected: false })));
    };

    const fillAll = () => {
        // Fill up to credits limit
        setGrid((prev) => {
            let filled = 0;
            return prev.map((cell) => {
                if (filled < credits) {
                    filled++;
                    return { ...cell, selected: true };
                }
                return { ...cell, selected: false };
            });
        });

        if (credits < grid.length) {
            toast.warning(`Limited to ${credits} commits (your current credit balance)`);
        }
    };

    const generateRandomPattern = () => {
        setGrid((prev) => {
            let filled = 0;
            // First clear
            const cleared = prev.map(c => ({ ...c, selected: false }));
            // Then random fill up to limit
            return cleared.map((cell) => {
                if (filled < credits && Math.random() > 0.7) {
                    filled++;
                    return { ...cell, selected: true };
                }
                return cell;
            });
        });
    };

    const handleGenerateCommits = async () => {
        if (!selectedRepo) {
            toast.error('Please select a repository first');
            return;
        }

        const selectedCells = grid.filter(cell => cell.selected);
        if (selectedCells.length === 0) return;

        // Reset and Open Dialog
        setIsGenerating(true);
        setIsMinimized(false);
        setProgressStep('init');
        setProgress({ current: 0, total: selectedCells.length });
        setErrorMessage(undefined);

        try {
            // 1. Calculate Dates
            const today = new Date();
            const currentDayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)

            // We need to build the list first to know total count and iterate easily
            // Note: We need parentSha for each commit, which depends on the previous one.
            // Client-side, we can just prepare dates. The logic loop will handle chaining SHAs.

            const rawCommits = selectedCells.map(cell => {
                const weekDiff = 51 - cell.week;
                const dayDiff = currentDayOfWeek - cell.day;
                const totalDaysDiff = (weekDiff * 7) + dayDiff;
                const date = subDays(today, totalDaysDiff);
                // Random time between 9am and 6pm
                date.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60), 0);
                return {
                    date: date.toISOString(),
                    message: `Contribution: ${date.toISOString().split('T')[0]}`
                };
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // IMPORTANT: Sort chronologically

            setProgress({ current: 0, total: rawCommits.length });


            // 2. Initial Repo State (Get HEAD)
            const repoState = await getRepoState(selectedRepo);

            // Handle Empty Repo specifically
            if (repoState.error && repoState.error.includes('Repository is empty')) {
                setErrorMessage(repoState.error);
                setProgressStep('needs_init');
                return; // Stop here, wait for user action
            }

            if (repoState.error || !repoState.sha || !repoState.branch) {
                throw new Error(repoState.error || 'Failed to initialize repository state');
            }

            let currentParentSha = repoState.sha;
            const BATCH_SIZE = 10;
            let processed = 0;

            // 3. Process in Batches
            setProgressStep('creating');

            for (let i = 0; i < rawCommits.length; i += BATCH_SIZE) {
                const batch = rawCommits.slice(i, i + BATCH_SIZE).map(c => ({
                    ...c,
                    parentSha: '' // Will be set in the loop logic if we were creating individually, but for batch API we need to pass chain
                }));
                // Wait, our batch API `createCommitBatch` handles a list.
                // But it assumes `parentSha` is passed for each.
                // We actually need to chain them: commit[0].parent = HEAD, commit[1].parent = commit[0].sha
                // BUT server batch action iterates.
                // So we pass the *starting* parent SHA to the server action, or pass the full chain?
                // Step 1285 `createCommitBatch`:
                // takes `commits: { ... parentSha }[]`.
                // And iterates: `let currentParentSha = commits[0].parentSha`.
                // Then inside loop: `parents: [currentParentSha]`. `currentParentSha = newCommit.sha`.
                // So if we pass a batch, we only really need to provide `parentSha` for the FIRST item?
                // Actually my implementation uses `commits[i].parentSha`?
                // No: `let currentParentSha = commits[0].parentSha;`
                // Then loop `for (const commit of commits)`.
                // It uses `currentParentSha` (from variable) as parent.
                // So the `parentSha` property on individual commit objects in the array is IGNORED after the first one.
                // Correct.

                // Construct the batch for the API
                const batchPayload = batch.map((c, index) => ({
                    date: c.date,
                    message: c.message,
                    parentSha: index === 0 ? currentParentSha : 'ignore' // Logic uses currentParentSha variable
                }));

                const batchResult = await createCommitBatch(selectedRepo, batchPayload);

                if (batchResult.error || !batchResult.lastSha) {
                    throw new Error(batchResult.error || 'Failed to create commit batch');
                }

                currentParentSha = batchResult.lastSha;
                processed += batchResult.count || 0;
                setProgress(prev => ({ ...prev, current: processed }));
            }

            // 4. Push Changes
            setProgressStep('pushing');
            const pushResult = await pushChanges(selectedRepo, repoState.branch, currentParentSha);

            if (pushResult.error) {
                throw new Error(pushResult.error);
            }

            // Done!
            setProgressStep('complete');

            // Record successful job
            await recordCommitJob({
                repository: selectedRepo,
                totalCommits: rawCommits.length,
                status: 'COMPLETED'
            });

        } catch (error: any) {
            console.error('Generation process failed:', error);
            setErrorMessage(error.message || 'An unknown error occurred');
            setProgressStep('error');

            // Record failed job
            await recordCommitJob({
                repository: selectedRepo,
                totalCommits: grid.filter(cell => cell.selected).length,
                status: 'FAILED',
                errorMessage: error.message || 'An unknown error occurred'
            });
        }
    };

    const handleCloseDialog = () => {
        setIsGenerating(false);
        // Only refresh if complete? Users might want to see error.
        if (progressStep === 'complete') {
            window.location.reload(); // Refresh to see stats if needed, or just rely on revalidatePath
        }
    };

    const handleInitializeRepo = async () => {
        if (!selectedRepo) return;

        setProgressStep('init');
        setErrorMessage(undefined);

        try {
            const result = await initializeRepository(selectedRepo);
            if (result.success) {
                toast.success('Repository initialized successfully!');
                setProgressStep('idle');
                setIsGenerating(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            setErrorMessage(error.message);
            setProgressStep('error');
        }
    };

    const isRepoEmpty = progressStep === 'needs_init';

    return (
        <div className="space-y-6" onMouseUp={handleMouseUp}>
            <CommitProgressDialog
                isOpen={isGenerating}
                step={progressStep}
                progress={progress}
                message={errorMessage}
                onClose={handleCloseDialog}
                actionLabel={isRepoEmpty ? "Initialize Repository" : undefined}
                onAction={isRepoEmpty ? handleInitializeRepo : undefined}
                isMinimized={isMinimized}
                onMinimize={setIsMinimized}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Target Repository</CardTitle>
                    <CardDescription>
                        Select the repository where your contribution graph will be pushed
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2 max-w-md">
                        {loadingRepos ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-md">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading repositories...
                            </div>
                        ) : (
                            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a repository..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {repositories.map((repo) => (
                                        <SelectItem key={repo.id} value={repo.fullName}>
                                            <div className="flex items-center gap-2">
                                                <span>{repo.fullName}</span>
                                                {repo.private && (
                                                    <span className="text-xs bg-muted px-2 py-0.5 rounded">Private</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {repoStats && !loadingStats && (
                            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium ml-1">
                                <GitCommit className="h-3.5 w-3.5" />
                                <span>{repoStats.commitCount.toLocaleString()} total commits</span>
                            </div>
                        )}
                        {loadingStats && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse ml-1">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Updating stats...</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {isOverLimit && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Credit Limit Reached
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            You have selected {selectedCount} days, which is your current credit limit.
                            <Link href="/dashboard/plans" className="ml-1 font-bold underline hover:text-amber-900 dark:hover:text-amber-100">
                                Get more credits
                            </Link> to design larger patterns.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Draw Mode</CardTitle>
                        <CardDescription>
                            Paint your pattern
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button
                            variant={drawMode === 'fill' ? 'default' : 'outline'}
                            onClick={() => setDrawMode('fill')}
                            className={`justify-start shadow-sm ${drawMode === 'fill' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        >
                            <Brush className={`mr-2 h-4 w-4 ${drawMode === 'fill' ? 'text-white' : 'text-green-600'}`} />
                            Fill Mode
                        </Button>
                        <Button
                            variant={drawMode === 'erase' ? 'default' : 'outline'}
                            onClick={() => setDrawMode('erase')}
                            className="justify-start shadow-sm"
                        >
                            <Eraser className={`mr-2 h-4 w-4 ${drawMode === 'erase' ? 'text-white' : 'text-red-600'}`} />
                            Erase Mode
                        </Button>
                        <Separator className="my-2" />
                        <Button variant="ghost" size="sm" onClick={generateRandomPattern} className="justify-start shadow-sm bg-muted/50">
                            <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                            Random Pattern
                        </Button>
                        <Button variant="ghost" size="sm" onClick={fillAll} className="justify-start shadow-sm bg-muted/50">
                            <PaintBucket className="mr-2 h-4 w-4 text-green-600" />
                            Fill Everything
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearGrid} className="justify-start text-destructive hover:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                            Clear Grid
                        </Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Contribution Calendar</CardTitle>
                        <CardDescription className="flex items-center justify-between">
                            <span>{selectedCount} days selected (~{selectedCount} commits)</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOverLimit ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}`}>
                                Credits: {selectedCount} / {credits}
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto pb-4 custom-scrollbar">
                            <div className="inline-flex gap-1">
                                {Array.from({ length: 52 }, (_, week) => (
                                    <div key={week} className="flex flex-col gap-1">
                                        {Array.from({ length: 7 }, (_, day) => {
                                            const cell = grid.find((c) => c.week === week && c.day === day);
                                            return (
                                                <div
                                                    key={`${week}-${day}`}
                                                    className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-green-400 ${cell?.selected
                                                        ? 'bg-green-600 hover:bg-green-700'
                                                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
                                                        } ${isOverLimit && !cell?.selected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    onMouseDown={() => handleMouseDown(week, day)}
                                                    onMouseEnter={() => handleMouseEnter(week, day)}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-800" />
                                <div className="w-3 h-3 rounded-sm bg-green-200" />
                                <div className="w-3 h-3 rounded-sm bg-green-400" />
                                <div className="w-3 h-3 rounded-sm bg-green-600" />
                            </div>
                            <span>More</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {!isGenerating && (
                <div className="flex justify-end animate-in fade-in duration-500">
                    <Button
                        size="lg"
                        className={`px-8 shadow-lg transition-all ${isOverLimit ? 'bg-green-600/50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                        disabled={selectedCount === 0 || !selectedRepo}
                        onClick={handleGenerateCommits}
                    >
                        <GitGraph className="mr-2 h-5 w-5" />
                        {isOverLimit ? `At Credit Limit (${selectedCount})` : `Generate ${selectedCount} Commits`}
                    </Button>
                </div>
            )}
        </div>
    );
}
