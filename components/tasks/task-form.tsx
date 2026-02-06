'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, X, Coins, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Repository {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    description: string | null;
    url: string;
    defaultBranch: string;
}

interface TaskFormProps {
    initialData?: {
        id?: string;
        name: string;
        repositories: { fullName: string }[];
        distribution: 'RANDOM' | 'EQUAL';
        schedule: string;
        creditLimit: number | null;
    };
    isEditing?: boolean;
}

interface SelectedRepo {
    fullName: string;
    commits: number;
}

export function TaskForm({ initialData, isEditing = false }: TaskFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingRepos, setFetchingRepos] = useState(true);
    const [repositories, setRepositories] = useState<Repository[]>([]);

    const [taskName, setTaskName] = useState(initialData?.name || '');
    const [selectedRepos, setSelectedRepos] = useState<SelectedRepo[]>(
        initialData?.repositories.map((r: any) => ({
            fullName: r.fullName,
            commits: r.commits || 1
        })) || []
    );
    const [distribution, setDistribution] = useState<'RANDOM' | 'EQUAL'>(
        initialData?.distribution || 'RANDOM'
    );
    const [creditLimit, setCreditLimit] = useState<string>(
        initialData?.creditLimit?.toString() || ''
    );

    // Extract HH:mm from cron (simplistic: assuming MM HH * * *)
    const initialTime = initialData?.schedule ?
        (() => {
            const parts = initialData.schedule.split(' ');
            return `${parts[1].padStart(2, '0')}:${parts[0].padStart(2, '0')}`;
        })() : '09:00';

    const [scheduleTime, setScheduleTime] = useState(initialTime);
    const [schedule, setSchedule] = useState(initialData?.schedule || '0 9 * * *');

    useEffect(() => {
        async function fetchRepositories() {
            try {
                const response = await fetch('/api/github/repositories');
                const data = await response.json();

                if (response.ok) {
                    setRepositories(data.repositories || []);
                } else {
                    toast.error('Failed to load repositories', {
                        description: data.error || 'Please connect your GitHub account first',
                    });
                }
            } catch (error) {
                console.error('Failed to fetch repositories:', error);
                toast.error('Failed to load repositories');
            } finally {
                setFetchingRepos(false);
            }
        }

        fetchRepositories();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (selectedRepos.length === 0) {
            toast.error('Please select at least one repository');
            return;
        }

        setLoading(true);

        try {
            const url = isEditing ? `/api/tasks/${initialData?.id}` : '/api/tasks';
            const method = isEditing ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: taskName,
                    repositories: selectedRepos.map(r => ({
                        fullName: r.fullName,
                        commits: r.commits
                    })),
                    distribution,
                    schedule,
                    creditLimit: creditLimit ? parseInt(creditLimit) : null,
                    pattern: {},
                }),
            });

            if (response.ok) {
                toast.success(isEditing ? 'Task updated successfully' : 'Task created successfully');
                router.push('/dashboard/tasks');
                router.refresh();
            } else {
                const data = await response.json();
                toast.error(isEditing ? 'Failed to update task' : 'Failed to create task', {
                    description: data.error || 'Please try again',
                });
            }
        } catch (error) {
            console.error('Task form error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }

    const updateRepoCommits = (fullName: string, commits: number) => {
        setSelectedRepos(prev => prev.map(r =>
            r.fullName === fullName ? { ...r, commits: Math.max(1, commits) } : r
        ));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/tasks">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">{isEditing ? 'Edit Task' : 'Create New Task'}</h1>
                    <p className="text-muted-foreground mt-2">
                        {isEditing ? 'Modify your automated commit task' : 'Schedule automated commits to your repositories'}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Task Configuration</CardTitle>
                    <CardDescription>
                        Configure your contribution patterns and target repositories
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Task Name</Label>
                            <Input
                                id="name"
                                placeholder="Daily contributions"
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>Repositories</Label>

                            <div className="space-y-3 mb-4">
                                {selectedRepos.map(repo => (
                                    <div key={repo.fullName} className="flex items-center justify-between p-3 rounded-lg border bg-primary/5 border-primary/10">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-2">
                                                {repo.fullName}
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedRepos(prev => prev.filter(r => r.fullName !== repo.fullName))}
                                                    className="ml-1 hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        </div>

                                        {distribution === 'EQUAL' && (
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-muted-foreground">Commits:</Label>
                                                <Input
                                                    type="number"
                                                    value={repo.commits}
                                                    onChange={(e) => updateRepoCommits(repo.fullName, parseInt(e.target.value) || 1)}
                                                    className="w-20 h-8 text-center"
                                                    min="1"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {selectedRepos.length === 0 && !fetchingRepos && (
                                    <p className="text-sm text-muted-foreground italic px-2 py-1">No repositories selected yet.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                {fetchingRepos ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-md bg-muted/20">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        Loading repositories...
                                    </div>
                                ) : repositories.length === 0 ? (
                                    <div className="p-4 border border-dashed rounded-md bg-muted/10">
                                        <p className="text-sm text-muted-foreground mb-3 text-center">
                                            No repositories found.
                                        </p>
                                        <div className="flex justify-center">
                                            <Link href="/dashboard/settings">
                                                <Button variant="outline" size="sm">
                                                    Connect GitHub Account
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Select
                                            value=""
                                            onValueChange={(val) => {
                                                if (val && !selectedRepos.find(r => r.fullName === val)) {
                                                    setSelectedRepos(prev => [...prev, { fullName: val, commits: 1 }]);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Add a repository..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {repositories
                                                    .filter(repo => !selectedRepos.find(r => r.fullName === repo.fullName))
                                                    .map((repo: any) => (
                                                        <SelectItem key={repo.id} value={repo.fullName}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{repo.fullName}</span>
                                                                {repo.private && (
                                                                    <Badge variant="outline" className="text-[10px] bg-muted/50">
                                                                        Private
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-muted-foreground">
                                            Tip: You can add multiple repositories to rotate your commits.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="distribution">Distribution</Label>
                                <Select value={distribution} onValueChange={(val: any) => setDistribution(val)}>
                                    <SelectTrigger id="distribution" className="w-full">
                                        <SelectValue placeholder="Select distribution" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="RANDOM">Random Rotation</SelectItem>
                                        <SelectItem value="EQUAL">Even Coverage (Round Robin)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="creditLimit" className="flex items-center gap-2">
                                    <Coins className="h-4 w-4 text-yellow-500" />
                                    Credit Limit
                                </Label>
                                <Input
                                    id="creditLimit"
                                    type="number"
                                    placeholder="No limit"
                                    value={creditLimit}
                                    onChange={(e) => setCreditLimit(e.target.value)}
                                    min="1"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time">Schedule Time</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => {
                                        setScheduleTime(e.target.value);
                                        const [hours, minutes] = e.target.value.split(':');
                                        setSchedule(`${parseInt(minutes)} ${parseInt(hours)} * * *`);
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 pt-6 border-t">
                            <Button type="submit" disabled={loading || fetchingRepos} className="px-8">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Save Changes' : 'Create Task'}
                            </Button>
                            <Link href="/dashboard/tasks">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
