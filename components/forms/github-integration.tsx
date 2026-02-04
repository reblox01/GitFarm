'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Github, CheckCircle2, XCircle } from 'lucide-react';
import { initiateGitHubLink, disconnectGitHub } from '@/app/actions/github';
import { toast } from 'sonner';

export function GitHubIntegration({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Check if GitHub account is connected on mount
        async function checkConnection() {
            try {
                const response = await fetch('/api/github/status');
                const data = await response.json();
                setConnected(data.connected);
                setUsername(data.username);
                setAvatarUrl(data.avatarUrl);
            } catch (error) {
                console.error('Failed to check GitHub connection:', error);
            } finally {
                setChecking(false);
            }
        }
        checkConnection();
    }, []);

    async function handleConnect() {
        setLoading(true);
        try {
            await initiateGitHubLink();
        } catch (error) {
            console.error('GitHub connection error:', error);
            setLoading(false);
        }
    }

    async function handleDisconnect() {
        if (!confirm('Are you sure you want to disconnect your GitHub account?')) {
            return;
        }

        setLoading(true);
        const result = await disconnectGitHub();
        if (result?.success) {
            setConnected(false);
            setUsername(null);
            setAvatarUrl(null);
            toast.success('GitHub account disconnected');
        } else if (result?.error) {
            toast.error('Failed to disconnect', {
                description: result.error,
            });
        }
        setLoading(false);
    }

    if (checking) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>GitHub Integration</CardTitle>
                    <CardDescription>
                        Connect your GitHub account to commit to repositories
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Checking connection...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>GitHub Integration</CardTitle>
                <CardDescription>
                    Connect your GitHub account to commit to repositories
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {connected && avatarUrl ? (
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={avatarUrl} alt={username || 'GitHub'} />
                                <AvatarFallback><Github className="h-5 w-5" /></AvatarFallback>
                            </Avatar>
                        ) : (
                            <Github className="h-10 w-10" />
                        )}
                        <div>
                            <p className="font-medium flex items-center gap-2">
                                {connected && username ? `@${username}` : 'GitHub Account'}
                                {connected ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {connected ? 'Connected' : 'Not connected'}
                            </p>
                        </div>
                    </div>
                    {connected ? (
                        <Button
                            variant="destructive"
                            onClick={handleDisconnect}
                            disabled={loading}
                        >
                            Disconnect
                        </Button>
                    ) : (
                        <Button onClick={handleConnect} disabled={loading}>
                            <Github className="mr-2 h-4 w-4" />
                            Connect GitHub
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
