'use client';

import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/components/forms/profile-form';
import { PasswordForm } from '@/components/forms/password-form';
import { GitHubIntegration } from '@/components/forms/github-integration';
import { Coins, ArrowUpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SettingsTabsProps {
    user: {
        id: string;
        name: string;
        email: string;
        credits: number;
    };
}

export function SettingsTabs({ user }: SettingsTabsProps) {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab');
    const [defaultTab, setDefaultTab] = useState('profile');

    useEffect(() => {
        if (tab === 'integrations' || tab === 'billing' || tab === 'profile') {
            setDefaultTab(tab);
        }
    }, [tab]);

    return (
        <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full">
            <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
                <ProfileForm user={{
                    name: user.name,
                    email: user.email,
                }} />
                <PasswordForm />
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
                <GitHubIntegration userId={user.id} />
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Current Plan</CardTitle>
                        <CardDescription>
                            Manage your subscription and billing
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Free Plan</p>
                                <p className="text-sm text-muted-foreground">
                                    Limited features
                                </p>
                            </div>
                            <Badge>Active</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage & Credits</CardTitle>
                        <CardDescription>
                            Your remaining balance and usage statistics
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500 rounded-lg text-white">
                                    <Coins className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Available Balance</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-500">{user.credits?.toLocaleString() || 0} Credits</p>
                                </div>
                            </div>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                                <a href="/dashboard/plans">
                                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                                    Get More
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
