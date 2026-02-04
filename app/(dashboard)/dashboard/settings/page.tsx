import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SettingsTabs } from '@/components/settings-tabs';

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences
                </p>
            </div>

            <SettingsTabs user={{
                id: session.user.id,
                name: session.user.name || '',
                email: session.user.email || '',
            }} />
        </div>
    );
}
