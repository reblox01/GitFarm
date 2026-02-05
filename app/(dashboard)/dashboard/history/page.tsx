import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, GitCommit, Github, ExternalLink, CheckCircle2, XCircle, Clock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default async function HistoryPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const jobs = await prisma.commitJob.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Generation History</h1>
                    <p className="text-muted-foreground mt-2">
                        View all your past commit generation jobs
                    </p>
                </div>
            </div>

            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle>All Jobs</CardTitle>
                    <CardDescription>
                        {jobs.length} jobs recorded
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {jobs.length === 0 ? (
                        <div className="text-center py-24 text-muted-foreground border-t">
                            <GitCommit className="h-16 w-16 mx-auto mb-4 opacity-10" />
                            <p>No commit jobs found.</p>
                            <Button variant="outline" className="mt-4" asChild>
                                <Link href="/dashboard/editor">Create your first pattern</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y border-t">
                            {jobs.map((job) => (
                                <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-muted/50 transition-colors gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                            job.status === 'FAILED' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                            }`}>
                                            {job.status === 'COMPLETED' ? <CheckCircle2 className="h-6 w-6" /> :
                                                job.status === 'FAILED' ? <XCircle className="h-6 w-6" /> :
                                                    <Clock className="h-6 w-6 animate-pulse" />
                                            }
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-bold text-lg">
                                                    {job.completedCommits} / {job.totalCommits} Commits
                                                </p>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${job.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50' :
                                                    job.status === 'RUNNING' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50' :
                                                        job.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50' :
                                                            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                                    }`}>
                                                    {job.status}
                                                </span>
                                            </div>

                                            {job.repositoryUrl && (
                                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                    <Github className="h-4 w-4 mr-2 opacity-70" />
                                                    <span className="font-medium">{job.repositoryUrl}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <p className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-1 opacity-50" />
                                                    {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                                </p>
                                                {job.completedAt && (
                                                    <p>Completed in {Math.round((new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()) / 1000)}s</p>
                                                )}
                                            </div>

                                            {job.errorMessage && (
                                                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-mono">
                                                    Error: {job.errorMessage}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        {job.repositoryUrl && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a
                                                    href={`https://github.com/${job.repositoryUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center"
                                                >
                                                    View on GitHub
                                                    <ExternalLink className="ml-2 h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
