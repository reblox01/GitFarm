'use server';

import { prisma } from '@/lib/db';
import { checkRateLimit, apiLimiter } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { PaymentStatus, PaymentProvider } from '@prisma/client';

export type PaymentFilters = {
    status?: PaymentStatus[];
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    limit?: number;
    offset?: number;
};

export async function getPaymentTransactions(filters: PaymentFilters = {}) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            console.log(`[PAYMENTS_DEBUG] UNAUTHORIZED: user=${session?.user?.email}, role=${session?.user?.role}`);
            return { error: 'Unauthorized' };
        }

        const { limit = 50, offset = 0, status, dateFrom, dateTo, search } = filters;

        // Build where clause
        const where: any = {};

        if (status && status.length > 0) {
            where.status = { in: status };
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = dateFrom;
            if (dateTo) where.createdAt.lte = dateTo;
        }

        if (search) {
            where.user = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        // Fetch transactions
        const transactions = await prisma.paymentTransaction.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                plan: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // Get total count for pagination
        const total = await prisma.paymentTransaction.count({ where });

        console.log(`[PAYMENTS_DEBUG] Found ${transactions.length} transactions out of ${total} total`);

        return {
            success: true,
            data: transactions,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: Math.floor(offset / limit) + 1,
            },
        };
    } catch (error) {
        console.error('Failed to fetch payments:', error);
        return { error: 'Failed to fetch payment transactions' };
    }
}

export async function getPaymentStats() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return { error: 'Unauthorized' };
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Parallel queries
        const [totalRevenue, thisMonthRevenue, lastMonthRevenue, recentSuccess, recentFailed] = await Promise.all([
            // Total revenue (completed only)
            prisma.paymentTransaction.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { amount: true },
            }),
            // This month
            prisma.paymentTransaction.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startOfMonth }
                },
                _sum: { amount: true },
            }),
            // Last month
            prisma.paymentTransaction.aggregate({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
                },
                _sum: { amount: true },
            }),
            // Recent success count
            prisma.paymentTransaction.count({
                where: { status: 'COMPLETED' },
            }),
            // Recent failed count
            prisma.paymentTransaction.count({
                where: { status: 'FAILED' },
            }),
        ]);

        return {
            success: true,
            data: {
                totalRevenue: totalRevenue._sum.amount || 0,
                thisMonthRevenue: thisMonthRevenue._sum.amount || 0,
                lastMonthRevenue: lastMonthRevenue._sum.amount || 0,
                totalTransactions: recentSuccess + recentFailed,
                successRate: recentSuccess > 0 ? (recentSuccess / (recentSuccess + recentFailed)) * 100 : 0,
            },
        };

    } catch (error) {
        console.error('Failed to fetch payment stats:', error);
        return { error: 'Failed to fetch payment statistics' };
    }
}

export async function getUserPayments() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized' };
        }

        const transactions = await prisma.paymentTransaction.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                plan: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return {
            success: true,
            data: transactions,
        };
    } catch (error) {
        console.error('Failed to fetch user payments:', error);
        return { error: 'Failed to fetch payment history' };
    }
}
