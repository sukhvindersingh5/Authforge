import { Request, Response, NextFunction } from 'express';
import { rbacService } from '../services';
import { ApiResponse } from '../types';

// ============================================
// RBAC CONTROLLER
// ============================================

class RbacController {
    // ============================================
    // GET /roles
    // ============================================

    async listRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const orgId = req.user?.orgId;
            const roles = await rbacService.getAllRoles(orgId);

            const response: ApiResponse<typeof roles> = {
                success: true,
                data: roles,
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // POST /roles
    // ============================================

    async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, description } = req.body;
            const orgId = req.user?.orgId;

            const role = await rbacService.createRole(name, description, orgId);

            const response: ApiResponse<typeof role> = {
                success: true,
                data: role,
            };

            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // DELETE /roles/:id
    // ============================================

    async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            await rbacService.deleteRole(id);

            res.status(200).json({
                success: true,
                data: { message: 'Role deleted successfully' },
            });
        } catch (error) {
            next(error);
        }
    }
}

export const rbacController = new RbacController();
export default RbacController;
