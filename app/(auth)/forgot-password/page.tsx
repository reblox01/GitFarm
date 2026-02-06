'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { requestPasswordReset } from '@/app/actions/auth-reset';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await requestPasswordReset(formData);

        setLoading(false);

        if (result.success) {
            setSuccess(true);
            toast.success('Reset link sent', {
                description: result.message
            });
        } else {
            toast.error('Error', {
                description: result.error
            });
        }
    }

    if (success) {
        return (
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
                    <p className="text-sm text-muted-foreground">
                        We've sent a password reset link to your email address.
                    </p>
                </div>
                <Link href="/login">
                    <Button variant="outline" className="w-full h-11">
                        Back to Login
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Forgot Password
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

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
                    <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20 transition-all hover:scale-[1.01] font-semibold"
                        disabled={loading}
                    >
                        {loading ? 'Sending link...' : 'Send Reset Link'}
                    </Button>
                </form>
            </div>

            <p className="px-8 text-center text-sm text-muted-foreground">
                <Link href="/login" className="hover:text-brand underline underline-offset-4">
                    Back to Login
                </Link>
            </p>
        </div>
    );
}
