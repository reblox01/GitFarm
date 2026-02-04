import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const settingsSchema = z.object({
    paymentProvider: z.enum(['STRIPE', 'LEMON_SQUEEZY']),
});

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.siteSettings.findFirst();

        return NextResponse.json({
            paymentProvider: settings?.paymentProvider || 'STRIPE',
            config: settings?.config || {},
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validated = settingsSchema.parse(body);

        // Update or create settings
        const existingSettings = await prisma.siteSettings.findFirst();

        if (existingSettings) {
            await prisma.siteSettings.update({
                where: { id: existingSettings.id },
                data: { paymentProvider: validated.paymentProvider },
            });
        } else {
            await prisma.siteSettings.create({
                data: { paymentProvider: validated.paymentProvider },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
