import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSettings } from '@/app/actions/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsForm } from './settings-form';

export default async function AdminSettingsPage() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

    const settings = await getSettings();

    if (!settings) return <div>Error loading settings</div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Site Settings</h2>
                <p className="text-muted-foreground">Manage global configuration for GitFarm.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Onboarding & Verification</CardTitle>
                    <CardDescription>Configure how new users are onboarded and verified.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm settings={settings} />
                </CardContent>
            </Card>
        </div>
    );
}
