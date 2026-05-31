import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

// ============================================
// SLIDING WINDOW RATE LIMITER
// ============================================

interface SlidingWindowConfig {
    windowMs: number;
    maxRequests: number;
    keyPrefix: string;
    message?: string;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (req: Request) => string;
}

export function slidingWindowRateLimiter(config: SlidingWindowConfig) {
    const {
        windowMs,
        maxRequests,
        keyPrefix,
        message = 'Too many requests, please try again later',
        skipSuccessfulRequests = false,
        keyGenerator = (req) => req.ip || 'unknown',
    } = config;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const key = `${keyPrefix}:${keyGenerator(req)}`;
            const now = Date.now();
            const windowStart = now - windowMs;

            // Remove old entries and count current window
            await redis.zremrangebyscore(key, 0, windowStart);
            const currentCount = await redis.zcard(key);

            if (currentCount >= maxRequests) {
                const oldestEntry = await redis.zrange(key, 0, 0, 'WITHSCORES');
                const retryAfter = oldestEntry.length > 1
                    ? Math.ceil((parseInt(oldestEntry[1]) + windowMs - now) / 1000)
                    : Math.ceil(windowMs / 1000);

                res.setHeader('Retry-After', retryAfter);
                res.setHeader('X-RateLimit-Limit', maxRequests);
                res.setHeader('X-RateLimit-Remaining', 0);
                res.setHeader('X-RateLimit-Reset', new Date(now + retryAfter * 1000).toISOString());

                res.status(429).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message,
                        retryAfter,
                    },
                });
                return;
            }

            // Add current request
            await redis.zadd(key, now, `${now}:${Math.random()}`);
            await redis.expire(key, Math.ceil(windowMs / 1000));

            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', maxRequests - currentCount - 1);

            // Note: skipSuccessfulRequests feature removed for type safety
            // If needed, implement with response-time or on-finished packages

            next();
        } catch (error) {
            // Fail open on Redis errors
            console.error('Rate limiter error:', error);
            next();
        }
    };
}

// ============================================
// Pre-configured Rate Limiters
// ============================================

// Strict login limiter
export const strictLoginLimiter = slidingWindowRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'rl:login',
    message: 'Too many login attempts. Please try again in 15 minutes.',
    skipSuccessfulRequests: true,
});

// Signup limiter
export const strictSignupLimiter = slidingWindowRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyPrefix: 'rl:signup',
    message: 'Too many signup attempts. Please try again in an hour.',
});

// Password reset limiter
export const strictPasswordResetLimiter = slidingWindowRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyPrefix: 'rl:password-reset',
    message: 'Too many password reset attempts. Please try again in an hour.',
});

// API limiter for authenticated users
export const authenticatedApiLimiter = slidingWindowRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyPrefix: 'rl:api',
    keyGenerator: (req) => req.user?.sub || req.ip || 'unknown',
});

// Strict API limiter for unauthenticated
export const unauthenticatedApiLimiter = slidingWindowRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyPrefix: 'rl:api:unauth',
});
