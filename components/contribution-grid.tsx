'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateCommits } from '@/app/actions/commits';
import { subDays } from 'date-fns';

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
    const [generating, setGenerating] = useState(false);

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

        setGenerating(true);
        toast.info('Generating commits...', { description: 'Please wait while we communicate with GitHub.' });

        try {
            // Calculate dates
            // Default: week 51 is current week.
            const today = new Date();
            const currentDayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)

            const pattern = selectedCells.map(cell => {
                // Calculate difference in days from today
                // week 51, currentDayOfWeek = today
                // diff = (51 - cell.week) * 7 + (currentDayOfWeek - cell.day)

                const weekDiff = 51 - cell.week;
                const dayDiff = currentDayOfWeek - cell.day;
                const totalDaysDiff = (weekDiff * 7) + dayDiff;

                const date = subDays(today, totalDaysDiff);

                return {
                    date: date.toISOString().split('T')[0], // YYYY-MM-DD
                    count: 1 // Default to 1 commit per selected cell
                };
            });

            // Process via server action
            const result = await generateCommits(selectedRepo, pattern);

            if (result.success) {
                toast.success('Commits generated successfully!', {
                    description: `Created ${result.commitsCreated} commits. They should appear on your GitHub profile shortly.`
                });
            } else if (result.error) {
                toast.error('Failed to generate commits', {
                    description: result.error
                });
            }

        } catch (error) {
            console.error('Commit generation error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setGenerating(false);
        }
    };

    const selectedCount = grid.filter((cell) => cell.selected).length;

    return (
        <div className="space-y-6" onMouseUp={handleMouseUp}>
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
                        disabled={selectedCount === 0 || !selectedRepo || generating}
                        onClick={handleGenerateCommits}
                    >
                        {generating ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-5 w-5" />
                                Generate {selectedCount} Commits
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
