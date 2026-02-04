'use client';

import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfileForm } from '@/components/forms/profile-form';
import { PasswordForm } from '@/components/forms/password-form';
import { GitHubIntegration } from '@/components/forms/github-integration';
import { useEffect, useState } from 'react';

interface SettingsTabsProps {
    user: {
        id: string;
        name: string;
        email: string;
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
                            Track your monthly usage
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Commits Generated</span>
                                <span className="font-medium">0 / 100</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Active Tasks</span>
                                <span className="font-medium">0 / 3</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
