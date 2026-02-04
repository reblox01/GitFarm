import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis instance (only if Upstash credentials are provided)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Rate limiter for API routes (per IP)
export const apiLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
        analytics: true,
    })
    : null;

// Rate limiter for authentication (per IP)
export const authLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
        analytics: true,
    })
    : null;

// Rate limiter for commit jobs (per user)
export const commitJobLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 jobs per hour
        analytics: true,
    })
    : null;

// Helper function to check rate limit
export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string
): Promise<{ success: boolean; remaining?: number }> {
    if (!limiter) {
        // If rate limiting is not configured, allow all requests
        return { success: true };
    }

    const { success, remaining } = await limiter.limit(identifier);
    return { success, remaining };
}
