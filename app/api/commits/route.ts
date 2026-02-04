import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { checkRateLimit, commitJobLimiter } from '@/lib/rate-limit';

const createJobSchema = z.object({
    pattern: z.array(z.object({
        week: z.number().min(0).max(51),
        day: z.number().min(0).max(6),
        selected: z.boolean(),
    })),
    repositoryUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limiting
        const { success } = await checkRateLimit(commitJobLimiter, session.user.id);
        if (!success) {
            return NextResponse.json(
                { error: 'Too many commit jobs. Please wait before creating another.' },
                { status: 429 }
            );
        }

        // Validate input
        const body = await req.json();
        const validated = createJobSchema.parse(body);

        // Calculate total commits
        const selectedDays = validated.pattern.filter((day) => day.selected);
        const totalCommits = selectedDays.length;

        if (totalCommits === 0) {
            return NextResponse.json(
                { error: 'No days selected' },
                { status: 400 }
            );
        }

        // Check user's plan limits
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                subscription: {
                    include: {
                        plan: {
                            include: {
                                features: {
                                    include: {
                                        feature: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Get commits per month limit
        const commitsFeature = user?.subscription?.plan.features.find(
            (pf) => pf.feature.key === 'commits_per_month'
        );
        const monthlyLimit = commitsFeature?.limitValue || 100; // Default to 100

        // Check if user has exceeded their monthly limit
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const commitsThisMonth = await prisma.commitJob.aggregate({
            where: {
                userId: session.user.id,
                createdAt: {
                    gte: startOfMonth,
                },
            },
            _sum: {
                completedCommits: true,
            },
        });

        const usedCommits = commitsThisMonth._sum.completedCommits || 0;
        if (usedCommits + totalCommits > monthlyLimit) {
            return NextResponse.json(
                {
                    error: `Monthly limit exceeded. You have ${monthlyLimit - usedCommits} commits remaining this month.`,
                },
                { status: 403 }
            );
        }

        // Create commit job
        const job = await prisma.commitJob.create({
            data: {
                userId: session.user.id,
                status: 'PENDING',
                totalCommits,
                completedCommits: 0,
                pattern: validated.pattern,
                repositoryUrl: validated.repositoryUrl,
            },
        });

        // TODO: Trigger background job processing
        // This would typically be handled by a queue system like BullMQ
        // or a serverless function

        return NextResponse.json({
            success: true,
            jobId: job.id,
            totalCommits,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error creating commit job:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const jobs = await prisma.commitJob.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        return NextResponse.json({ jobs });
    } catch (error) {
        console.error('Error fetching commit jobs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
