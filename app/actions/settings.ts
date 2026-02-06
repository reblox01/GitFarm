'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return null;

    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
        settings = await prisma.siteSettings.create({
            data: {
                freeCreditsOnVerify: 100,
                requireEmailVerify: true,
            }
        });
    }

    return settings;
}

export async function updateSettings(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    const freeCreditsOnVerify = parseInt(formData.get('freeCreditsOnVerify') as string) || 0;
    const requireEmailVerify = formData.get('requireEmailVerify') === 'on';

    try {
        const settings = await prisma.siteSettings.findFirst();

        if (settings) {
            await prisma.siteSettings.update({
                where: { id: settings.id },
                data: {
                    freeCreditsOnVerify,
                    requireEmailVerify,
                }
            });
        } else {
            await prisma.siteSettings.create({
                data: {
                    freeCreditsOnVerify,
                    requireEmailVerify,
                }
            });
        }

        revalidatePath('/admin/settings');
        return { success: true, message: 'Settings updated' };
    } catch (error) {
        console.error('Update settings error:', error);
        return { error: 'Failed to update settings' };
    }
}
