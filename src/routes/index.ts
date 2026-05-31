import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import rbacRoutes from './rbac.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
        },
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', rbacRoutes);

export default router;
