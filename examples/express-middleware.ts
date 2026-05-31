/**
 * Express.js Middleware Example
 * 
 * How to protect your Express routes with AuthForge
 */

import { Request, Response, NextFunction } from 'express';

interface AuthForgeConfig {
    authServiceUrl: string;
    publicKey?: string; // For local JWT validation
}

// ============================================
// MIDDLEWARE FACTORY
// ============================================

export function createAuthMiddleware(config: AuthForgeConfig) {
    return async function authenticate(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const token = authHeader.substring(7);

            // Validate token with AuthForge
            const response = await fetch(`${config.authServiceUrl}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                res.status(401).json({ error: 'Invalid token' });
                return;
            }

            const { data: user } = await response.json();
            (req as any).user = user;

            next();
        } catch (error) {
            next(error);
        }
    };
}

// ============================================
// PERMISSION MIDDLEWARE
// ============================================

export function requirePermission(resource: string, action: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;

        if (!user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const hasPermission = user.permissions.some((p: string) => {
            const [r, a, s] = p.split(':');
            return (r === '*' || r === resource) && (a === '*' || a === action);
        });

        if (!hasPermission) {
            res.status(403).json({ error: 'Permission denied' });
            return;
        }

        next();
    };
}

// ============================================
// USAGE EXAMPLE
// ============================================

/*
import express from 'express';
import { createAuthMiddleware, requirePermission } from './authforge-middleware';

const app = express();
const authenticate = createAuthMiddleware({
  authServiceUrl: 'http://localhost:3000/api/v1'
});

// Public route
app.get('/public', (req, res) => {
  res.json({ message: 'Public endpoint' });
});

// Protected route
app.get('/protected', authenticate, (req, res) => {
  res.json({ user: (req as any).user });
});

// Permission-based route
app.delete('/users/:id',
  authenticate,
  requirePermission('users', 'delete'),
  (req, res) => {
    res.json({ message: 'User deleted' });
  }
);

app.listen(3001);
*/

export default createAuthMiddleware;
