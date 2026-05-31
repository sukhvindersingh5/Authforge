import { Router } from 'express';
import { userController } from '../controllers';
import { authenticate, requireRole, validate } from '../middleware';
import { updateUserSchema, assignRoleSchema } from '../utils/validators';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ============================================
// Current User Routes
// ============================================

// GET /users/me
router.get('/me', userController.getMe.bind(userController));

// PATCH /users/me
router.patch(
    '/me',
    validate(updateUserSchema),
    userController.updateMe.bind(userController)
);

// ============================================
// Admin User Routes
// ============================================

// GET /users (admin only)
router.get(
    '/',
    requireRole('admin', 'super_admin'),
    userController.listUsers.bind(userController)
);

// GET /users/:id (admin only)
router.get(
    '/:id',
    requireRole('admin', 'super_admin'),
    userController.getUser.bind(userController)
);

// POST /users/:id/roles (admin only)
router.post(
    '/:id/roles',
    requireRole('admin', 'super_admin'),
    validate(assignRoleSchema),
    userController.assignRole.bind(userController)
);

// DELETE /users/:id/roles/:roleId (admin only)
router.delete(
    '/:id/roles/:roleId',
    requireRole('admin', 'super_admin'),
    userController.removeRole.bind(userController)
);

export default router;
