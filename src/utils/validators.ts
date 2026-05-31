import { z } from 'zod';

// ============================================
// Password Validation Rules
// ============================================

const passwordSchema = z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must not exceed 128 characters');

// ============================================
// Auth Validation Schemas
// ============================================

export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    orgId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    deviceInfo: z.object({
        name: z.string().optional(),
        fingerprint: z.string().optional(),
        userAgent: z.string().optional(),
        ipAddress: z.string().optional(),
    }).optional(),
});

export const refreshSchema = z.object({
    refreshToken: z.string().optional(),
});

export const logoutSchema = z.object({
    allSessions: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
});

export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
});

// ============================================
// User Validation Schemas
// ============================================

export const updateUserSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
});

// ============================================
// RBAC Validation Schemas
// ============================================

export const createRoleSchema = z.object({
    name: z.string().min(1, 'Role name is required').max(50),
    description: z.string().max(255).optional(),
    permissions: z.array(z.string().uuid()).optional(),
});

export const assignRoleSchema = z.object({
    roleId: z.string().uuid('Invalid role ID'),
});

// ============================================
// Type Exports
// ============================================

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
