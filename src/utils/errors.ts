// ============================================
// Error Codes for AuthForge
// ============================================

export const ErrorCodes = {
    // Authentication Errors (401)
    AUTH_INVALID_CREDENTIALS: {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        status: 401,
    },
    AUTH_TOKEN_EXPIRED: {
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Access token has expired',
        status: 401,
    },
    AUTH_TOKEN_INVALID: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid or malformed token',
        status: 401,
    },
    AUTH_REFRESH_EXPIRED: {
        code: 'AUTH_REFRESH_EXPIRED',
        message: 'Refresh token has expired',
        status: 401,
    },
    AUTH_SESSION_REVOKED: {
        code: 'AUTH_SESSION_REVOKED',
        message: 'Session has been revoked',
        status: 401,
    },
    AUTH_MFA_INVALID: {
        code: 'AUTH_MFA_INVALID',
        message: 'Invalid MFA code',
        status: 401,
    },

    // Authorization Errors (403)
    AUTH_EMAIL_NOT_VERIFIED: {
        code: 'AUTH_EMAIL_NOT_VERIFIED',
        message: 'Email verification required',
        status: 403,
    },
    AUTH_ACCOUNT_SUSPENDED: {
        code: 'AUTH_ACCOUNT_SUSPENDED',
        message: 'Account has been suspended',
        status: 403,
    },
    RBAC_PERMISSION_DENIED: {
        code: 'RBAC_PERMISSION_DENIED',
        message: 'Insufficient permissions',
        status: 403,
    },

    // Not Found Errors (404)
    USER_NOT_FOUND: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        status: 404,
    },
    RBAC_ROLE_NOT_FOUND: {
        code: 'RBAC_ROLE_NOT_FOUND',
        message: 'Role not found',
        status: 404,
    },

    // Conflict Errors (409)
    USER_ALREADY_EXISTS: {
        code: 'USER_ALREADY_EXISTS',
        message: 'Email is already registered',
        status: 409,
    },

    // Locked Errors (423)
    AUTH_ACCOUNT_LOCKED: {
        code: 'AUTH_ACCOUNT_LOCKED',
        message: 'Account is temporarily locked due to too many failed attempts',
        status: 423,
    },

    // Rate Limit Errors (429)
    RATE_LIMIT_EXCEEDED: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        status: 429,
    },

    // Validation Errors (400)
    VALIDATION_ERROR: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        status: 400,
    },

    // Server Errors (500)
    INTERNAL_ERROR: {
        code: 'INTERNAL_ERROR',
        message: 'An internal server error occurred',
        status: 500,
    },
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

// Custom error class
export class AppError extends Error {
    public readonly code: string;
    public readonly status: number;
    public readonly details?: unknown;

    constructor(
        errorCode: ErrorCode | typeof ErrorCodes[ErrorCode],
        details?: unknown
    ) {
        const error = typeof errorCode === 'string'
            ? ErrorCodes[errorCode]
            : errorCode;

        super(error.message);
        this.code = error.code;
        this.status = error.status;
        this.details = details;
        this.name = 'AppError';

        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
        };
    }
}
