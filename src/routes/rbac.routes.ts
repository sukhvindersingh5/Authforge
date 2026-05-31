import { Router } from 'express';
import { rbacController } from '../controllers';
import { authenticate, requireRole, validate } from '../middleware';
import { createRoleSchema } from '../utils/validators';

const router = Router();

// All RBAC routes require authentication
router.use(authenticate);

// ============================================
// Role Routes
// ============================================

// GET /roles
router.get('/', rbacController.listRoles.bind(rbacController));

// POST /roles (admin only)
router.post(
    '/',
    requireRole('admin', 'super_admin'),
    validate(createRoleSchema),
    rbacController.createRole.bind(rbacController)
);

// DELETE /roles/:id (admin only)
router.delete(
    '/:id',
    requireRole('admin', 'super_admin'),
    rbacController.deleteRole.bind(rbacController)
);

export default router;
