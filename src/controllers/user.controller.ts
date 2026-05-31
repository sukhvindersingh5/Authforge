import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { rbacService, auditService } from '../services';
import { ApiResponse, UserResponse, AuditEventType } from '../types';
import { AppError } from '../utils/errors';

// ============================================
// USER CONTROLLER
// ============================================

class UserController {
    // ============================================
    // GET /users/me
    // ============================================

    async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.sub;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    userRoles: {
                        include: {
                            role: {
                                include: {
                                    rolePermissions: {
                                        include: { permission: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!user) {
                throw new AppError('USER_NOT_FOUND');
            }

            const roles = user.userRoles.map(ur => ur.role.name);
            const permissions = this.extractPermissions(user.userRoles);

            const response: ApiResponse<UserResponse> = {
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    emailVerified: user.emailVerified,
                    status: user.status,
                    roles,
                    permissions,
                    createdAt: user.createdAt,
                },
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // PATCH /users/me
    // ============================================

    async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.sub;
            const { firstName, lastName } = req.body;

            const user = await prisma.user.update({
                where: { id: userId },
                data: {
                    ...(firstName && { firstName }),
                    ...(lastName && { lastName }),
                },
            });

            const roles = await rbacService.getUserRoles(userId);
            const permissions = await rbacService.getUserPermissions(userId);

            const response: ApiResponse<UserResponse> = {
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    emailVerified: user.emailVerified,
                    status: user.status,
                    roles,
                    permissions,
                    createdAt: user.createdAt,
                },
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // GET /users (Admin)
    // ============================================

    async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
            const skip = (page - 1) * limit;

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        status: true,
                        emailVerified: true,
                        createdAt: true,
                        userRoles: {
                            include: { role: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.user.count(),
            ]);

            const response: ApiResponse<{
                users: Array<Omit<UserResponse, 'permissions'>>;
                pagination: { page: number; limit: number; total: number; pages: number };
            }> = {
                success: true,
                data: {
                    users: users.map(u => ({
                        id: u.id,
                        email: u.email,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        emailVerified: u.emailVerified,
                        status: u.status,
                        roles: u.userRoles.map(ur => ur.role.name),
                        createdAt: u.createdAt,
                    })),
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit),
                    },
                },
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // GET /users/:id (Admin)
    // ============================================

    async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const user = await prisma.user.findUnique({
                where: { id },
                include: {
                    userRoles: {
                        include: { role: true },
                    },
                },
            });

            if (!user) {
                throw new AppError('USER_NOT_FOUND');
            }

            const permissions = await rbacService.getUserPermissions(id);

            const response: ApiResponse<UserResponse> = {
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    emailVerified: user.emailVerified,
                    status: user.status,
                    roles: user.userRoles.map(ur => ur.role.name),
                    permissions,
                    createdAt: user.createdAt,
                },
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // POST /users/:id/roles (Admin)
    // ============================================

    async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { roleId } = req.body;
            const grantedBy = req.user!.sub;

            await rbacService.assignRole(id, roleId, grantedBy);

            await auditService.log({
                userId: id,
                eventType: AuditEventType.ROLE_ASSIGNED,
                metadata: { roleId, grantedBy },
            });

            res.status(200).json({
                success: true,
                data: { message: 'Role assigned successfully' },
            });
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // DELETE /users/:id/roles/:roleId (Admin)
    // ============================================

    async removeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id, roleId } = req.params;
            const removedBy = req.user!.sub;

            await rbacService.removeRole(id, roleId);

            await auditService.log({
                userId: id,
                eventType: AuditEventType.ROLE_REMOVED,
                metadata: { roleId, removedBy },
            });

            res.status(200).json({
                success: true,
                data: { message: 'Role removed successfully' },
            });
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // Helper Methods
    // ============================================

    private extractPermissions(userRoles: Array<{
        role: {
            rolePermissions: Array<{
                permission: { resource: string; action: string; scope: string };
            }>;
        };
    }>): string[] {
        const permissions = new Set<string>();

        for (const ur of userRoles) {
            for (const rp of ur.role.rolePermissions) {
                const perm = `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope}`;
                permissions.add(perm);
            }
        }

        return Array.from(permissions);
    }
}

export const userController = new UserController();
export default UserController;
