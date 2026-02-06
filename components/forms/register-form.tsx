'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { handleRegister } from '@/app/(auth)/actions';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export function RegisterForm() {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const router = useRouter();

    const checkStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length > 8) score += 1;
        if (pass.length > 12) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return score;
    };

    const strength = checkStrength(password);

    const getStrengthColor = (s: number) => {
        if (s <= 2) return 'bg-red-500';
        if (s <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthText = (s: number) => {
        if (password.length === 0) return '';
        if (s <= 2) return 'Weak';
        if (s <= 3) return 'Fair';
        return 'Strong';
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await handleRegister(formData);

            if (result?.success) {
                toast.success('Account created successfully!', {
                    description: 'You are now signed in',
                });
                router.push('/dashboard');
                return;
            }

            if (result?.error) {
                toast.error('Registration failed', {
                    description: result.error,
                });
            }
        } catch (error: any) {
            toast.error('Registration error', {
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
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        disabled={loading}
                        className="h-11 bg-muted/50 border-muted-foreground/20 focus:bg-background focus:border-green-500 transition-all font-medium"
                    />
                </div>
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
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            minLength={8}
                            disabled={loading}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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

                    {password.length > 0 && (
                        <div className="space-y-1">
                            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                <div
                                    className={`h-full ${getStrengthColor(strength)} transition-all duration-300 ease-in-out`}
                                    style={{ width: `${(strength / 5) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Strength</span>
                                <span className={`font-medium ${strength <= 2 ? 'text-red-500' : strength <= 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                                    {getStrengthText(strength)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20 transition-all hover:scale-[1.01] font-semibold"
                    disabled={loading}
                >
                    {loading ? 'Creating account...' : 'Create Account'}
                </Button>
            </form>
        </div>
    );
}
