import { z } from 'zod';

// Validate environment variables at startup
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    LEMON_SQUEEZY_API_KEY: z.string().optional(),
    LEMON_SQUEEZY_STORE_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
