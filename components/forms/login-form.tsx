'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Github } from 'lucide-react';
import { handleCredentialsSignIn, handleGithubSignIn } from '@/app/(auth)/actions';
import { toast } from 'sonner';

export function LoginForm() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            await handleCredentialsSignIn(formData);
            toast.success('Welcome back!');
            router.push('/dashboard');
        } catch (error: any) {
            // Extract error message from URL if redirected with error
            const errorMessage = error?.message || 'Invalid credentials';
            toast.error('Login failed', {
                description: errorMessage.includes('invalid')
                    ? 'Email or password is incorrect'
                    : 'Please check your credentials and try again',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                    Sign in to your account to continue
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <form action={handleGithubSignIn}>
                    <Button
                        type="submit"
                        variant="outline"
                        className="w-full"
                        disabled={loading}
                    >
                        <Github className="mr-2 h-4 w-4" />
                        GitHub
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
