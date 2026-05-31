import { User, Role, Permission } from '@prisma/client';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
}

// ============================================
// Authentication Types
// ============================================

export interface TokenPayload {
    sub: string;          // User ID
    jti: string;          // Token ID
    iss: string;          // Issuer
    aud: string[];        // Audience
    exp: number;          // Expiration
    iat: number;          // Issued at
    sessionId: string;
    roles: string[];
    permissions: string[];
    orgId?: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    permissions: string[];
    orgId?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
    deviceInfo?: DeviceInfo;
}

export interface SignupRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    orgId?: string;
}

export interface DeviceInfo {
    name?: string;
    fingerprint?: string;
    userAgent?: string;
    ipAddress?: string;
}

export interface RefreshRequest {
    refreshToken?: string;  // From cookie or body
}

export interface LogoutRequest {
    allSessions?: boolean;
}

// ============================================
// User Types
// ============================================

export type UserWithRoles = User & {
    userRoles: Array<{
        role: Role & {
            rolePermissions: Array<{
                permission: Permission;
            }>;
        };
    }>;
};

export interface UserResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    status: string;
    roles: string[];
    permissions: string[];
    createdAt: Date;
}

// ============================================
// RBAC Types
// ============================================

export interface PermissionCheck {
    resource: string;
    action: string;
    scope?: string;
}

export interface RoleWithPermissions extends Role {
    permissions: string[];
}

// ============================================
// Session Types
// ============================================

export interface SessionData {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: Record<string, unknown>;
    permissions: string[];
    createdAt: Date;
    lastActiveAt: Date;
}

// ============================================
// Audit Types
// ============================================

export enum AuditEventType {
    // Authentication
    LOGIN_SUCCESS = 'auth.login.success',
    LOGIN_FAILED = 'auth.login.failed',
    LOGOUT = 'auth.logout',
    SIGNUP = 'auth.signup',
    TOKEN_REFRESH = 'auth.token.refresh',
    TOKEN_REVOKED = 'auth.token.revoked',

    // Password
    PASSWORD_CHANGE = 'auth.password.change',
    PASSWORD_RESET_REQUEST = 'auth.password.reset.request',
    PASSWORD_RESET_COMPLETE = 'auth.password.reset.complete',

    // MFA
    MFA_ENABLED = 'auth.mfa.enabled',
    MFA_DISABLED = 'auth.mfa.disabled',
    MFA_VERIFIED = 'auth.mfa.verified',
    MFA_FAILED = 'auth.mfa.failed',

    // Account
    ACCOUNT_LOCKED = 'account.locked',
    ACCOUNT_UNLOCKED = 'account.unlocked',
    ACCOUNT_SUSPENDED = 'account.suspended',
    EMAIL_VERIFIED = 'account.email.verified',

    // RBAC
    ROLE_ASSIGNED = 'rbac.role.assigned',
    ROLE_REMOVED = 'rbac.role.removed',
    PERMISSION_CHANGED = 'rbac.permission.changed',
}

export interface AuditLogEntry {
    userId?: string;
    eventType: AuditEventType;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
}
