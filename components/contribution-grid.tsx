'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GitGraph, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRepoState, createCommitBatch, pushChanges, initializeRepository } from '@/app/actions/commits';
import { subDays } from 'date-fns';
import { CommitProgressDialog, ProgressStep } from './commit-progress-dialog';

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

export function ContributionGrid() {
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

    const toggleCell = (week: number, day: number) => {
        setGrid((prev) =>
            prev.map((cell) =>
                cell.week === week && cell.day === day
                    ? { ...cell, selected: drawMode === 'fill' ? true : false }
                    : cell
            )
        );
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
        setGrid((prev) => prev.map((cell) => ({ ...cell, selected: true })));
    };

    const generateRandomPattern = () => {
        setGrid((prev) =>
            prev.map((cell) => ({ ...cell, selected: Math.random() > 0.7 }))
        );
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
        setProgressStep('init');
        setProgress({ current: 0, total: selectedCells.length });
        setErrorMessage(undefined);

        try {
            // 1. Calculate Dates
            const today = new Date();
            const currentDayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
            const commitsToCreate: { date: string; message: string; parentSha: string }[] = [];

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

        } catch (error: any) {
            console.error('Generation process failed:', error);
            setErrorMessage(error.message || 'An unknown error occurred');
            setProgressStep('error');
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

    const selectedCount = grid.filter((cell) => cell.selected).length;
    const isRepoEmptyError = errorMessage?.toLowerCase().includes('empty');

    return (
        <div className="space-y-6" onMouseUp={handleMouseUp}>
            <CommitProgressDialog
                isOpen={isGenerating}
                step={progressStep}
                progress={progress}
                message={errorMessage}
                onClose={handleCloseDialog}
                actionLabel={isRepoEmptyError ? "Initialize Repository" : undefined}
                onAction={isRepoEmptyError ? handleInitializeRepo : undefined}
            />

            {/* Show specific error action if applicable - actually we can put this INSIDE the dialog or show a toast action */}
            {/* But since we use a custom dialog, maybe we should pass an 'action' prop to it? */}
            {/* Or render another dialog? */}
            {/* Let's simplify: If errorMessage contains "empty", we can show a button in the main UI or modify the dialog. */}
            {/* I will modify CommitProgressDialog to accept an optional 'action' button. */}


            <Card>
                <CardHeader>
                    <CardTitle>Draw Mode</CardTitle>
                    <CardDescription>
                        Click to toggle individual days, or drag to paint multiple days
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <Button
                        variant={drawMode === 'fill' ? 'default' : 'outline'}
                        onClick={() => setDrawMode('fill')}
                    >
                        Fill Mode
                    </Button>
                    <Button
                        variant={drawMode === 'erase' ? 'default' : 'outline'}
                        onClick={() => setDrawMode('erase')}
                    >
                        Erase Mode
                    </Button>
                    <Separator orientation="vertical" className="h-10 hidden sm:block" />
                    <Button variant="outline" onClick={generateRandomPattern}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Random
                    </Button>
                    <Button variant="outline" onClick={fillAll}>
                        Fill All
                    </Button>
                    <Button variant="outline" onClick={clearGrid}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contribution Calendar</CardTitle>
                    <CardDescription>
                        {selectedCount} days selected (~{selectedCount} commits)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto pb-4">
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
                                                    }`}
                                                onMouseDown={() => handleMouseDown(week, day)}
                                                onMouseEnter={() => handleMouseEnter(week, day)}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
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

            <Card>
                <CardHeader>
                    <CardTitle>Generate Commits</CardTitle>
                    <CardDescription>
                        Create commit jobs based on your selected pattern
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Target Repository</Label>
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
                        <p className="text-xs text-muted-foreground">
                            Commits will be backdated to match the calendar pattern selected above.
                        </p>
                    </div>

                    <Button
                        className="w-full"
                        size="lg"
                        disabled={selectedCount === 0 || !selectedRepo || isGenerating}
                        onClick={handleGenerateCommits}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <GitGraph className="mr-2 h-5 w-5" />
                                Generate {selectedCount} Commits
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div >
    );
}
