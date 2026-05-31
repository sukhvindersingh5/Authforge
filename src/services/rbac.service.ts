import prisma from '../config/database';
import { redis } from '../config/redis';
import { AppError } from '../utils/errors';
import { PermissionCheck } from '../types';

// ============================================
// RBAC SERVICE
// ============================================

class RbacService {
    private readonly PERMISSION_CACHE_TTL = 300; // 5 minutes

    // ============================================
    // Permission Checking
    // ============================================

    async hasPermission(
        userId: string,
        permission: PermissionCheck
    ): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId);
        const requiredPerm = this.formatPermission(permission);

        // Check for exact match or wildcard permissions
        return userPermissions.some(p => this.matchPermission(p, requiredPerm));
    }

    async requirePermission(
        userId: string,
        permission: PermissionCheck
    ): Promise<void> {
        const hasAccess = await this.hasPermission(userId, permission);
        if (!hasAccess) {
            throw new AppError('RBAC_PERMISSION_DENIED');
        }
    }

    // ============================================
    // Get User Permissions
    // ============================================

    async getUserPermissions(userId: string): Promise<string[]> {
        // Check cache first
        const cacheKey = `permissions:${userId}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Load from database
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return [];
        }

        const permissions = new Set<string>();
        for (const ur of user.userRoles) {
            for (const rp of ur.role.rolePermissions) {
                const perm = `${rp.permission.resource}:${rp.permission.action}:${rp.permission.scope}`;
                permissions.add(perm);
            }
        }

        const permArray = Array.from(permissions);

        // Cache permissions
        await redis.set(cacheKey, JSON.stringify(permArray), 'EX', this.PERMISSION_CACHE_TTL);

        return permArray;
    }

    // ============================================
    // Role Management
    // ============================================

    async assignDefaultRole(userId: string): Promise<void> {
        // Find or create default 'user' role
        let defaultRole = await prisma.role.findFirst({
            where: { name: 'user', isSystem: true },
        });

        if (!defaultRole) {
            defaultRole = await prisma.role.create({
                data: {
                    name: 'user',
                    description: 'Default user role',
                    isSystem: true,
                },
            });

            // Assign basic permissions
            await this.assignDefaultPermissions(defaultRole.id);
        }

        // Assign role to user
        await prisma.userRole.upsert({
            where: {
                userId_roleId: { userId, roleId: defaultRole.id },
            },
            update: {},
            create: {
                userId,
                roleId: defaultRole.id,
            },
        });

        // Invalidate cache
        await this.invalidateUserPermissions(userId);
    }

    async assignRole(userId: string, roleId: string, grantedBy?: string): Promise<void> {
        const role = await prisma.role.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            throw new AppError('RBAC_ROLE_NOT_FOUND');
        }

        await prisma.userRole.upsert({
            where: {
                userId_roleId: { userId, roleId },
            },
            update: { grantedBy },
            create: {
                userId,
                roleId,
                grantedBy,
            },
        });

        // Invalidate cache
        await this.invalidateUserPermissions(userId);
    }

    async removeRole(userId: string, roleId: string): Promise<void> {
        await prisma.userRole.delete({
            where: {
                userId_roleId: { userId, roleId },
            },
        });

        // Invalidate cache
        await this.invalidateUserPermissions(userId);
    }

    async getUserRoles(userId: string): Promise<string[]> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: { role: true },
                },
            },
        });

        if (!user) {
            return [];
        }

        return user.userRoles.map(ur => ur.role.name);
    }

    // ============================================
    // Role CRUD
    // ============================================

    async createRole(
        name: string,
        description?: string,
        orgId?: string
    ): Promise<{ id: string; name: string; description: string | null }> {
        const role = await prisma.role.create({
            data: {
                name,
                description,
                organizationId: orgId,
            },
        });

        return role;
    }

    async deleteRole(roleId: string): Promise<void> {
        const role = await prisma.role.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            throw new AppError('RBAC_ROLE_NOT_FOUND');
        }

        if (role.isSystem) {
            throw new AppError('RBAC_PERMISSION_DENIED', { message: 'Cannot delete system roles' });
        }

        // Find all affected users
        const affectedUsers = await prisma.userRole.findMany({
            where: { roleId },
            select: { userId: true },
        });

        // Delete role (cascades to user_roles and role_permissions)
        await prisma.role.delete({
            where: { id: roleId },
        });

        // Invalidate cache for all affected users
        for (const ur of affectedUsers) {
            await this.invalidateUserPermissions(ur.userId);
        }
    }

    async getAllRoles(orgId?: string): Promise<Array<{ id: string; name: string; description: string | null }>> {
        const roles = await prisma.role.findMany({
            where: orgId ? { organizationId: orgId } : { isSystem: true },
            select: { id: true, name: true, description: true },
        });

        return roles;
    }

    // ============================================
    // Helper Methods
    // ============================================

    private formatPermission(check: PermissionCheck): string {
        return `${check.resource}:${check.action}:${check.scope || '*'}`;
    }

    private matchPermission(userPerm: string, requiredPerm: string): boolean {
        const [uResource, uAction, uScope] = userPerm.split(':');
        const [rResource, rAction, rScope] = requiredPerm.split(':');

        // Check resource
        if (uResource !== '*' && uResource !== rResource) {
            return false;
        }

        // Check action
        if (uAction !== '*' && uAction !== rAction) {
            return false;
        }

        // Check scope
        if (uScope !== '*' && uScope !== rScope) {
            // Check if user has broader scope
            if (uScope === 'all' && (rScope === 'org' || rScope === 'own')) {
                return true;
            }
            if (uScope === 'org' && rScope === 'own') {
                return true;
            }
            return false;
        }

        return true;
    }

    private async invalidateUserPermissions(userId: string): Promise<void> {
        await redis.del(`permissions:${userId}`);
    }

    private async assignDefaultPermissions(roleId: string): Promise<void> {
        // Create default permissions if they don't exist
        const defaultPerms = [
            { resource: 'users', action: 'read', scope: 'own' },
            { resource: 'users', action: 'update', scope: 'own' },
        ];

        for (const perm of defaultPerms) {
            const permission = await prisma.permission.upsert({
                where: {
                    resource_action_scope: perm,
                },
                update: {},
                create: {
                    ...perm,
                    description: `${perm.action} ${perm.scope} ${perm.resource}`,
                },
            });

            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: { roleId, permissionId: permission.id },
                },
                update: {},
                create: {
                    roleId,
                    permissionId: permission.id,
                },
            });
        }
    }
}

export const rbacService = new RbacService();
export default RbacService;
