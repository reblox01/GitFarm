import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, apiLimiter } from './lib/rate-limit';

export async function middleware(request: NextRequest) {
    // Rate limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
        const { success, remaining } = await checkRateLimit(apiLimiter, ip);

        if (!success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': remaining?.toString() || '0',
                    },
                }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/:path*',
    ],
};
