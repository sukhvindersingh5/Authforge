import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import config from '../config';

// ============================================
// Content Security Policy
// ============================================

export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: config.env === 'production' ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
});

// ============================================
// Additional Security Headers
// ============================================

export function additionalSecurityHeaders(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Prevent caching of sensitive data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    // Remove potentially leaky headers
    res.removeHeader('X-Powered-By');

    // Add feature policy
    res.setHeader('Permissions-Policy',
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    );

    next();
}

// ============================================
// Input Sanitization Middleware
// ============================================

export function sanitizeInput(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize query params
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query as Record<string, unknown>) as typeof req.query;
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params) as typeof req.params;
    }

    next();
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            // Remove null bytes and control characters
            sanitized[key] = value
                .replace(/\0/g, '')
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                .trim();
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

// ============================================
// Request Size Limits
// ============================================

export const bodySizeLimits = {
    json: '10kb',
    urlencoded: '10kb',
};

// ============================================
// Suspicious Activity Detection
// ============================================

export function detectSuspiciousActivity(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const suspiciousPatterns = [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,  // SQL injection
        /<script[^>]*>[\s\S]*?<\/script>/gi,  // XSS
        /(\%00)/i,  // Null byte injection
        /\.\.\//g,  // Path traversal
    ];

    const checkValue = (value: unknown): boolean => {
        if (typeof value === 'string') {
            return suspiciousPatterns.some(pattern => pattern.test(value));
        }
        if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(checkValue);
        }
        return false;
    };

    const isSuspicious =
        checkValue(req.body) ||
        checkValue(req.query) ||
        checkValue(req.params);

    if (isSuspicious) {
        console.warn(`[Security] Suspicious activity detected from IP: ${req.ip}`);
        // Log but don't block - could be false positive
        // In production, you might want to block or flag for review
    }

    next();
}
