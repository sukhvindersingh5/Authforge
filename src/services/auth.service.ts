import prisma from '../config/database';
import { tokenService } from './token.service';
import { auditService } from './audit.service';
import { rbacService } from './rbac.service';
import {
    hashPassword,
    verifyPassword,
    generateSecureToken,
    sanitizeEmail,
    sanitizeName,
} from '../utils/crypto';
import { AppError } from '../utils/errors';
import {
    TokenPair,
    UserResponse,
    DeviceInfo,
    AuditEventType,
} from '../types';
import { UserStatus } from '@prisma/client';

// ============================================
// AUTH SERVICE
// ============================================

class AuthService {
    private readonly MAX_FAILED_ATTEMPTS = 10;
    private readonly LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

    // ============================================
    // SIGNUP
    // ============================================

    async signup(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        orgId?: string,
        deviceInfo?: DeviceInfo
    ): Promise<{ user: UserResponse; message: string }> {
        const sanitizedEmail = sanitizeEmail(email);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
        });

        if (existingUser) {
            throw new AppError('USER_ALREADY_EXISTS');
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: sanitizedEmail,
                passwordHash,
                firstName: sanitizeName(firstName),
                lastName: sanitizeName(lastName),
                organizationId: orgId,
                status: UserStatus.PENDING,
            },
        });

        // Assign default user role
        await rbacService.assignDefaultRole(user.id);

        // Generate email verification token
        const verificationToken = generateSecureToken(32);
        await prisma.verificationToken.create({
            data: {
                userId: user.id,
                token: verificationToken,
                type: 'EMAIL_VERIFICATION',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        // Log audit event
        await auditService.log({
            userId: user.id,
            eventType: AuditEventType.SIGNUP,
            ipAddress: deviceInfo?.ipAddress,
            userAgent: deviceInfo?.userAgent,
            metadata: { email: sanitizedEmail },
        });

        // TODO: Send verification email with token

        return {
            user: this.formatUserResponse(user, [], []),
            message: 'Verification email sent',
        };
    }

    // ============================================
    // LOGIN
    // ============================================

    async login(
        email: string,
        password: string,
        deviceInfo?: DeviceInfo
    ): Promise<{ user: UserResponse; tokens: TokenPair }> {
        const sanitizedEmail = sanitizeEmail(email);

        // Find user with roles and permissions
        const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
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
            // Use constant-time comparison to prevent timing attacks
            await verifyPassword(password, '$argon2id$v=19$m=65536,t=3,p=4$dummy$hash');
            throw new AppError('AUTH_INVALID_CREDENTIALS');
        }

        // Check account status
        await this.checkAccountStatus(user);

        // Verify password
        const isValidPassword = await verifyPassword(password, user.passwordHash);

        if (!isValidPassword) {
            await this.handleFailedLogin(user.id, deviceInfo);
            throw new AppError('AUTH_INVALID_CREDENTIALS');
        }

        // Reset failed attempts on successful login
        if (user.failedAttempts > 0) {
            await prisma.user.update({
                where: { id: user.id },
                data: { failedAttempts: 0, lockedUntil: null },
            });
        }

        // Extract roles and permissions
        const roles = user.userRoles.map(ur => ur.role.name);
        const permissions = this.extractPermissions(user.userRoles);

        // Create session
        const session = await prisma.session.create({
            data: {
                userId: user.id,
                ipAddress: deviceInfo?.ipAddress,
                userAgent: deviceInfo?.userAgent,
                deviceFingerprint: deviceInfo?.fingerprint ? { fingerprint: deviceInfo.fingerprint } : undefined,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        // Generate tokens
        const tokens = await tokenService.generateTokenPair(
            user.id,
            session.id,
            roles,
            permissions,
            user.organizationId || undefined
        );

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Log audit event
        await auditService.log({
            userId: user.id,
            eventType: AuditEventType.LOGIN_SUCCESS,
            ipAddress: deviceInfo?.ipAddress,
            userAgent: deviceInfo?.userAgent,
            metadata: { sessionId: session.id },
        });

        return {
            user: this.formatUserResponse(user, roles, permissions),
            tokens,
        };
    }

    // ============================================
    // LOGOUT
    // ============================================

    async logout(
        userId: string,
        sessionId: string,
        jti: string,
        exp: number,
        allSessions: boolean = false,
        deviceInfo?: DeviceInfo
    ): Promise<void> {
        // Blacklist current access token
        await tokenService.revokeAccessToken(jti, exp);

        if (allSessions) {
            // Revoke all tokens and sessions
            await tokenService.revokeAllUserTokens(userId);
        } else {
            // Revoke only current session tokens
            await tokenService.revokeSessionTokens(sessionId);
            await prisma.session.delete({
                where: { id: sessionId },
            });
        }

        // Log audit event
        await auditService.log({
            userId,
            eventType: AuditEventType.LOGOUT,
            ipAddress: deviceInfo?.ipAddress,
            userAgent: deviceInfo?.userAgent,
            metadata: { allSessions },
        });
    }

    // ============================================
    // REFRESH TOKEN
    // ============================================

    async refreshToken(
        refreshToken: string,
        deviceInfo?: DeviceInfo
    ): Promise<TokenPair> {
        // Verify refresh token
        const { userId, sessionId } = await tokenService.verifyRefreshToken(refreshToken);

        // Get user with roles
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
            throw new AppError('USER_NOT_FOUND');
        }

        // Check account status
        await this.checkAccountStatus(user);

        // Extract roles and permissions
        const roles = user.userRoles.map(ur => ur.role.name);
        const permissions = this.extractPermissions(user.userRoles);

        // Rotate refresh token
        const tokens = await tokenService.rotateRefreshToken(
            refreshToken,
            userId,
            sessionId,
            roles,
            permissions,
            user.organizationId || undefined
        );

        // Update session activity
        await prisma.session.update({
            where: { id: sessionId },
            data: {
                lastActiveAt: new Date(),
                ipAddress: deviceInfo?.ipAddress,
                userAgent: deviceInfo?.userAgent,
            },
        });

        // Log audit event
        await auditService.log({
            userId,
            eventType: AuditEventType.TOKEN_REFRESH,
            ipAddress: deviceInfo?.ipAddress,
            userAgent: deviceInfo?.userAgent,
        });

        return tokens;
    }

    // ============================================
    // EMAIL VERIFICATION
    // ============================================

    async verifyEmail(token: string): Promise<void> {
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken) {
            throw new AppError('AUTH_TOKEN_INVALID');
        }

        if (verificationToken.usedAt) {
            throw new AppError('AUTH_TOKEN_INVALID');
        }

        if (verificationToken.expiresAt < new Date()) {
            throw new AppError('AUTH_TOKEN_EXPIRED');
        }

        // Update user and token
        await prisma.$transaction([
            prisma.user.update({
                where: { id: verificationToken.userId },
                data: {
                    emailVerified: true,
                    status: UserStatus.ACTIVE,
                },
            }),
            prisma.verificationToken.update({
                where: { id: verificationToken.id },
                data: { usedAt: new Date() },
            }),
        ]);

        // Log audit event
        await auditService.log({
            userId: verificationToken.userId,
            eventType: AuditEventType.EMAIL_VERIFIED,
        });
    }

    // ============================================
    // PASSWORD RESET
    // ============================================

    async requestPasswordReset(email: string, deviceInfo?: DeviceInfo): Promise<void> {
        const sanitizedEmail = sanitizeEmail(email);

        const user = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return;
        }

        // Generate reset token
        const resetToken = generateSecureToken(32);
        await prisma.verificationToken.create({
            data: {
                userId: user.id,
                token: resetToken,
                type: 'PASSWORD_RESET',
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
        });

        // Log audit event
        await auditService.log({
            userId: user.id,
            eventType: AuditEventType.PASSWORD_RESET_REQUEST,
            ipAddress: deviceInfo?.ipAddress,
            userAgent: deviceInfo?.userAgent,
        });

        // TODO: Send password reset email
    }

    async resetPassword(token: string, newPassword: string, deviceInfo?: DeviceInfo): Promise<void> {
        const resetToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!resetToken || resetToken.type !== 'PASSWORD_RESET') {
            throw new AppError('AUTH_TOKEN_INVALID');
        }

        if (resetToken.usedAt) {
            throw new AppError('AUTH_TOKEN_INVALID');
        }

        if (resetToken.expiresAt < new Date()) {
            throw new AppError('AUTH_TOKEN_EXPIRED');
        }

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update password and invalidate token
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: {
                    passwordHash,
                    failedAttempts: 0,
                    lockedUntil: null,
                },
            }),
            prisma.verificationToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() },
            }),
        ]);

        // Revoke all existing tokens for security
        await tokenService.revokeAllUserTokens(resetToken.userId);

        // Log audit event
        await auditService.log({
            userId: resetToken.userId,
            eventType: AuditEventType.PASSWORD_RESET_COMPLETE,
            ipAddress: deviceInfo?.ipAddress,
            userAgent: deviceInfo?.userAgent,
        });
    }

    // ============================================
    // CHANGE PASSWORD (LOGGED IN USER)
    // ============================================

    async changePassword(userId: string, currentPassword: string, newPassword: string, deviceInfo?: DeviceInfo): Promise<void> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('USER_NOT_FOUND');

        const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValidPassword) throw new AppError('AUTH_INVALID_CREDENTIALS', 400, 'Current password is incorrect');

        const passwordHash = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        // Revoke all other tokens to force re-login on other devices for security
        await tokenService.revokeAllUserTokens(userId);

        await auditService.log({
            userId,
            eventType: AuditEventType.PASSWORD_RESET_COMPLETE,
            ipAddress: deviceInfo?.ipAddress,
            userAgent: deviceInfo?.userAgent,
            metadata: { method: 'change_password' }
        });
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private async checkAccountStatus(user: {
        status: UserStatus;
        lockedUntil: Date | null;
        emailVerified: boolean;
    }): Promise<void> {
        if (user.status === UserStatus.SUSPENDED) {
            throw new AppError('AUTH_ACCOUNT_SUSPENDED');
        }

        if (user.status === UserStatus.LOCKED ||
            (user.lockedUntil && user.lockedUntil > new Date())) {
            throw new AppError('AUTH_ACCOUNT_LOCKED');
        }

        // Clear lock if expired
        if (user.lockedUntil && user.lockedUntil <= new Date()) {
            // Lock has expired, will be cleared on successful login
        }
    }

    private async handleFailedLogin(userId: string, deviceInfo?: DeviceInfo): Promise<void> {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { failedAttempts: { increment: 1 } },
        });

        // Log failed attempt
        await auditService.log({
            userId,
            eventType: AuditEventType.LOGIN_FAILED,
            ipAddress: deviceInfo?.ipAddress,
            userAgent: deviceInfo?.userAgent,
            metadata: { failedAttempts: user.failedAttempts },
        });

        // Lock account if too many attempts
        if (user.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    status: UserStatus.LOCKED,
                    lockedUntil: new Date(Date.now() + this.LOCKOUT_DURATION_MS),
                },
            });

            await auditService.log({
                userId,
                eventType: AuditEventType.ACCOUNT_LOCKED,
                ipAddress: deviceInfo?.ipAddress,
                metadata: { reason: 'too_many_failed_attempts' },
            });
        }
    }

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

    private formatUserResponse(
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            emailVerified: boolean;
            status: UserStatus;
            createdAt: Date;
        },
        roles: string[],
        permissions: string[]
    ): UserResponse {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            emailVerified: user.emailVerified,
            status: user.status,
            roles,
            permissions,
            createdAt: user.createdAt,
        };
    }
}

export const authService = new AuthService();
export default AuthService;
