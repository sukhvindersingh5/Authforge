import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services';
import { AppError } from '../utils/errors';
import { TokenPayload } from '../types';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
            requestId?: string;
        }
    }
}

// ============================================
// Authentication Middleware
// ============================================

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('AUTH_TOKEN_INVALID');
        }

        const token = authHeader.substring(7);
        const payload = await tokenService.verifyAccessToken(token);

        req.user = payload;
        next();
    } catch (error) {
        next(error);
    }
}

// ============================================
// Optional Authentication Middleware
// ============================================

export async function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = await tokenService.verifyAccessToken(token);
            req.user = payload;
        }

        next();
    } catch {
        // Ignore errors for optional auth
        next();
    }
}

// ============================================
// Permission Middleware Factory
// ============================================

export function requirePermission(resource: string, action: string, scope?: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                throw new AppError('AUTH_TOKEN_INVALID');
            }

            const requiredPerm = `${resource}:${action}:${scope || '*'}`;
            const hasPermission = req.user.permissions.some(p => matchPermission(p, requiredPerm));

            if (!hasPermission) {
                throw new AppError('RBAC_PERMISSION_DENIED');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

// ============================================
// Role Middleware Factory
// ============================================

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new AppError('AUTH_TOKEN_INVALID');
            }

            const hasRole = req.user.roles.some(r => roles.includes(r));

            if (!hasRole) {
                throw new AppError('RBAC_PERMISSION_DENIED');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

// ============================================
// Helper Functions
// ============================================

function matchPermission(userPerm: string, requiredPerm: string): boolean {
    const [uResource, uAction, uScope] = userPerm.split(':');
    const [rResource, rAction, rScope] = requiredPerm.split(':');

    // Check wildcard permissions
    if (uResource === '*' || uResource === rResource) {
        if (uAction === '*' || uAction === rAction) {
            if (uScope === '*' || uScope === rScope) {
                return true;
            }
            // Scope hierarchy
            if (uScope === 'all' && (rScope === 'org' || rScope === 'own')) return true;
            if (uScope === 'org' && rScope === 'own') return true;
        }
    }

    return false;
}
