'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CreditCard, Zap } from 'lucide-react';

export default function AdminSettingsPage() {
    const [paymentProvider, setPaymentProvider] = useState<'STRIPE' | 'LEMON_SQUEEZY'>('STRIPE');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch current settings
        fetch('/api/admin/settings')
            .then((res) => res.json())
            .then((data) => {
                if (data.paymentProvider) {
                    setPaymentProvider(data.paymentProvider);
                }
            })
            .catch((error) => console.error('Error fetching settings:', error));
    }, []);

    const handleUpdateProvider = async (provider: 'STRIPE' | 'LEMON_SQUEEZY') => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentProvider: provider }),
            });

            if (response.ok) {
                setPaymentProvider(provider);
                alert('Payment provider updated successfully');
            } else {
                alert('Failed to update payment provider');
            }
        } catch (error) {
            console.error('Error updating provider:', error);
            alert('Error updating payment provider');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Site Settings</h2>
                <p className="text-muted-foreground mt-1">
                    Configure global platform settings
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Provider</CardTitle>
                    <CardDescription>
                        Choose which payment processor to use for subscriptions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <Label>Active Provider</Label>
                        <div className="grid gap-3 md:grid-cols-2">
                            <button
                                onClick={() => handleUpdateProvider('STRIPE')}
                                disabled={loading}
                                className={`p-4 rounded-lg border-2 transition-all ${paymentProvider === 'STRIPE'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <CreditCard className="h-8 w-8" />
                                    <div className="text-left">
                                        <p className="font-medium">Stripe</p>
                                        <p className="text-sm text-muted-foreground">
                                            Industry-standard payments
                                        </p>
                                    </div>
                                </div>
                                {paymentProvider === 'STRIPE' && (
                                    <span className="block mt-2 text-xs font-medium text-primary">
                                        ✓ Active
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => handleUpdateProvider('LEMON_SQUEEZY')}
                                disabled={loading}
                                className={`p-4 rounded-lg border-2 transition-all ${paymentProvider === 'LEMON_SQUEEZY'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }'`}
                            >
                                <div className="flex items-center gap-3">
                                    <Zap className="h-8 w-8" />
                                    <div className="text-left">
                                        <p className="font-medium">Lemon Squeezy</p>
                                        <p className="text-sm text-muted-foreground">
                                            All-in-one platform
                                        </p>
                                    </div>
                                </div>
                                {paymentProvider === 'LEMON_SQUEEZY' && (
                                    <span className="block mt-2 text-xs font-medium text-primary">
                                        ✓ Active
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Environment Variables</CardTitle>
                    <CardDescription>
                        Make sure these are configured in your .env file
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="p-3 rounded bg-slate-100 dark:bg-slate-900">
                            <p className="font-mono">STRIPE_SECRET_KEY</p>
                            <p className="font-mono">STRIPE_PUBLISHABLE_KEY</p>
                            <p className="font-mono">STRIPE_WEBHOOK_SECRET</p>
                        </div>
                        <div className="p-3 rounded bg-slate-100 dark:bg-slate-900">
                            <p className="font-mono">LEMON_SQUEEZY_API_KEY</p>
                            <p className="font-mono">LEMON_SQUEEZY_STORE_ID</p>
                            <p className="font-mono">LEMON_SQUEEZY_WEBHOOK_SECRET</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
