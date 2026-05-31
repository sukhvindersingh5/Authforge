import { PrismaClient, UserStatus, MfaType, TokenType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ============================================
    // Create Default Permissions
    // ============================================

    const permissions = [
        // User permissions
        { resource: 'users', action: 'read', scope: 'own', description: 'Read own profile' },
        { resource: 'users', action: 'update', scope: 'own', description: 'Update own profile' },
        { resource: 'users', action: 'read', scope: 'all', description: 'Read all users' },
        { resource: 'users', action: 'update', scope: 'all', description: 'Update any user' },
        { resource: 'users', action: 'delete', scope: 'all', description: 'Delete any user' },

        // Role permissions
        { resource: 'roles', action: 'read', scope: 'all', description: 'Read all roles' },
        { resource: 'roles', action: 'create', scope: 'all', description: 'Create roles' },
        { resource: 'roles', action: 'update', scope: 'all', description: 'Update roles' },
        { resource: 'roles', action: 'delete', scope: 'all', description: 'Delete roles' },

        // Admin permissions
        { resource: 'admin', action: 'manage', scope: 'system', description: 'Full system access' },
    ];

    console.log('  Creating permissions...');
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { resource_action_scope: { resource: perm.resource, action: perm.action, scope: perm.scope } },
            update: {},
            create: perm,
        });
    }

    // ============================================
    // Create Default Roles
    // ============================================

    console.log('  Creating roles...');

    // Super Admin Role
    const superAdminRole = await prisma.role.upsert({
        where: { id: 'super-admin-role-id' },
        update: {},
        create: {
            id: 'super-admin-role-id',
            name: 'super_admin',
            description: 'Full system access',
            isSystem: true,
        },
    });

    // Admin Role
    const adminRole = await prisma.role.upsert({
        where: { id: 'admin-role-id' },
        update: {},
        create: {
            id: 'admin-role-id',
            name: 'admin',
            description: 'Administrative access',
            isSystem: true,
        },
    });

    // User Role
    const userRole = await prisma.role.upsert({
        where: { id: 'user-role-id' },
        update: {},
        create: {
            id: 'user-role-id',
            name: 'user',
            description: 'Standard user access',
            isSystem: true,
        },
    });

    // ============================================
    // Assign Permissions to Roles
    // ============================================

    console.log('  Assigning permissions to roles...');

    const allPermissions = await prisma.permission.findMany();

    // Super admin gets all permissions
    for (const perm of allPermissions) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
            update: {},
            create: { roleId: superAdminRole.id, permissionId: perm.id },
        });
    }

    // Admin gets user and role management permissions
    const adminPerms = allPermissions.filter(p =>
        (p.resource === 'users' || p.resource === 'roles') && p.scope === 'all'
    );
    for (const perm of adminPerms) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
            update: {},
            create: { roleId: adminRole.id, permissionId: perm.id },
        });
    }

    // User gets own permissions
    const userPerms = allPermissions.filter(p => p.scope === 'own');
    for (const perm of userPerms) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: userRole.id, permissionId: perm.id } },
            update: {},
            create: { roleId: userRole.id, permissionId: perm.id },
        });
    }

    // ============================================
    // Create Demo Admin User
    // ============================================

    console.log('  Creating demo admin user...');

    const adminPassword = await argon2.hash('Admin@123456!', {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
    });

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@authforge.io' },
        update: {},
        create: {
            email: 'admin@authforge.io',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            status: UserStatus.ACTIVE,
            emailVerified: true,
        },
    });

    // Assign super_admin role to admin user
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
        update: {},
        create: { userId: adminUser.id, roleId: superAdminRole.id },
    });

    // ============================================
    // Create Demo Regular User
    // ============================================

    console.log('  Creating demo regular user...');

    const userPassword = await argon2.hash('User@123456!', {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
    });

    const standardUser = await prisma.user.upsert({
        where: { email: 'user@authforge.io' },
        update: {},
        create: {
            email: 'user@authforge.io',
            passwordHash: userPassword,
            firstName: 'Standard',
            lastName: 'User',
            status: UserStatus.ACTIVE,
            emailVerified: true,
        },
    });

    // Assign user role to standard user
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: standardUser.id, roleId: userRole.id } },
        update: {},
        create: { userId: standardUser.id, roleId: userRole.id },
    });

    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📧 Demo Admin Credentials:');
    console.log('   Email: admin@authforge.io');
    console.log('   Password: Admin@123456!');
    console.log('');
    console.log('📧 Demo User Credentials:');
    console.log('   Email: user@authforge.io');
    console.log('   Password: User@123456!');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
