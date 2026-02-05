'use server';

import { prisma } from '@/lib/db';

export async function getActivePlans() {
    return await prisma.plan.findMany({
        orderBy: {
            price: 'asc'
        }
    });
}
