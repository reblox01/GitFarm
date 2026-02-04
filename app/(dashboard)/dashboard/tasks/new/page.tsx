'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Repository {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    description: string | null;
    url: string;
    defaultBranch: string;
}

export default function NewTaskPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingRepos, setFetchingRepos] = useState(true);
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [selectedRepo, setSelectedRepo] = useState('');
    const [taskName, setTaskName] = useState('');
    const [schedule, setSchedule] = useState('0 9 * * *'); // Default: Daily at 9 AM

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

        if (!selectedRepo) {
            toast.error('Please select a repository');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: taskName,
                    repository: selectedRepo,
                    schedule,
                    pattern: {}, // Placeholder - will be filled from contribution grid
                }),
            });

            if (response.ok) {
                toast.success('Task created successfully');
                router.push('/dashboard/tasks');
            } else {
                const data = await response.json();
                toast.error('Failed to create task', {
                    description: data.error || 'Please try again',
                });
            }
        } catch (error) {
            console.error('Task creation error:', error);
            toast.error('Failed to create task');
        } finally {
            setLoading(false);
        }
    }

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
                    <h1 className="text-3xl font-bold">Create New Task</h1>
                    <p className="text-muted-foreground mt-2">
                        Schedule automated commits to a repository
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Task Configuration</CardTitle>
                    <CardDescription>
                        Configure your automated commit task
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

                        <div className="space-y-2">
                            <Label htmlFor="repository">Repository</Label>
                            {fetchingRepos ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-md">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading repositories...
                                </div>
                            ) : repositories.length === 0 ? (
                                <div className="p-4 border rounded-md bg-muted/50">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        No repositories found. Please connect your GitHub account first.
                                    </p>
                                    <Link href="/dashboard/settings">
                                        <Button variant="outline" size="sm">
                                            Go to Settings
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <Select value={selectedRepo} onValueChange={setSelectedRepo} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a repository" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {repositories.map((repo) => (
                                            <SelectItem key={repo.id} value={repo.fullName}>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{repo.fullName}</span>
                                                    {repo.private && (
                                                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                                            Private
                                                        </span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {selectedRepo && (
                                <p className="text-xs text-muted-foreground">
                                    Selected: {selectedRepo}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="schedule">Schedule (Cron Expression)</Label>
                            <Input
                                id="schedule"
                                placeholder="0 9 * * *"
                                value={schedule}
                                onChange={(e) => setSchedule(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Default: Daily at 9:00 AM (0 9 * * *)
                            </p>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={loading || fetchingRepos}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Task'
                                )}
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
