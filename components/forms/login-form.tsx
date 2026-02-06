'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Github, Eye, EyeOff } from 'lucide-react';
import { handleCredentialsSignIn, handleGithubSignIn } from '@/app/(auth)/actions';
import { toast } from 'sonner';
import Link from 'next/link';

export function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await handleCredentialsSignIn(formData);

            if (result?.success) {
                toast.success('Welcome back!');
                router.push('/dashboard');
                return;
            }

            if (result?.error) {
                toast.error('Login failed', {
                    description: result.error,
                });
            }
        } catch (error: any) {
            toast.error('Login error', {
                description: 'An unexpected error occurred. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid gap-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        disabled={loading}
                        className="h-11 bg-muted/50 border-muted-foreground/20 focus:bg-background focus:border-green-500 transition-all font-medium"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-green-500 transition-colors">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            className="h-11 bg-muted/50 border-muted-foreground/20 focus:bg-background focus:border-green-500 transition-all font-medium pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
                <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20 transition-all hover:scale-[1.01] font-semibold"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
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
                    className="w-full h-11 border-muted-foreground/20 hover:bg-muted/50 hover:border-muted-foreground/50 transition-all"
                    disabled={loading}
                >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                </Button>
            </form>
        </div>
    );
}
