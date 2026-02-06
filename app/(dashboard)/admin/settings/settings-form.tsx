'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { updateSettings } from '@/app/actions/settings';
import { toast } from 'sonner';

interface SettingsFormProps {
    settings: {
        appName: string;
        supportEmail: string;
        freeCreditsOnVerify: number;
        requireEmailVerify: boolean;
    };
}

export function SettingsForm({ settings }: SettingsFormProps) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await updateSettings(formData);

        setLoading(false);

        if (result.success) {
            toast.success('Settings updated');
        } else {
            toast.error(result.error);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="appName">Site Name</Label>
                    <Input
                        id="appName"
                        name="appName"
                        defaultValue={settings.appName}
                        placeholder="GitFarm"
                        className="max-w-xs"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                        id="supportEmail"
                        name="supportEmail"
                        type="email"
                        defaultValue={settings.supportEmail}
                        placeholder="support@gitfarm.com"
                        className="max-w-xs"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="freeCreditsOnVerify">Free Credits on Verification</Label>
                    <p className="text-sm text-muted-foreground">
                        Number of credits to award users when they verify their email.
                    </p>
                    <Input
                        id="freeCreditsOnVerify"
                        name="freeCreditsOnVerify"
                        type="number"
                        min="0"
                        defaultValue={settings.freeCreditsOnVerify}
                        className="max-w-xs"
                    />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="requireEmailVerify">Require Email Verification</Label>
                        <p className="text-sm text-muted-foreground">
                            If enabled, users must verify email before spending credits.
                        </p>
                    </div>
                    <Switch
                        id="requireEmailVerify"
                        name="requireEmailVerify"
                        defaultChecked={settings.requireEmailVerify}
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
            </Button>
        </form>
    );
}
