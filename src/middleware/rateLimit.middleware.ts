import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config';

// ============================================
// General API Rate Limiter
// ============================================

export const apiRateLimiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxRequests,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.sub || req.ip || 'unknown';
    },
});

// ============================================
// Login Rate Limiter (Stricter)
// ============================================

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.security.loginRateLimitMax,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        // Rate limit by IP for login attempts
        return req.ip || 'unknown';
    },
    skipSuccessfulRequests: true, // Don't count successful logins
});

// ============================================
// Signup Rate Limiter
// ============================================

export const signupRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 signups per hour per IP
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many signup attempts, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================
// Password Reset Rate Limiter
// ============================================

export const passwordResetRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset requests per hour
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many password reset attempts, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
