import { Router } from 'express';
import { authController } from '../controllers';
import { validate, loginRateLimiter, signupRateLimiter, passwordResetRateLimiter } from '../middleware';
import { authenticate } from '../middleware';
import {
    signupSchema,
    loginSchema,
    logoutSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    verifyEmailSchema,
    changePasswordSchema,
} from '../utils/validators';

const router = Router();

// ============================================
// Public Routes
// ============================================

// POST /auth/signup
router.post(
    '/signup',
    signupRateLimiter,
    validate(signupSchema),
    authController.signup.bind(authController)
);

// POST /auth/login
router.post(
    '/login',
    loginRateLimiter,
    validate(loginSchema),
    authController.login.bind(authController)
);

// POST /auth/refresh
router.post(
    '/refresh',
    authController.refresh.bind(authController)
);

// POST /auth/verify-email
router.post(
    '/verify-email',
    validate(verifyEmailSchema),
    authController.verifyEmail.bind(authController)
);

// POST /auth/forgot-password
router.post(
    '/forgot-password',
    passwordResetRateLimiter,
    validate(forgotPasswordSchema),
    authController.forgotPassword.bind(authController)
);

// POST /auth/reset-password
router.post(
    '/reset-password',
    validate(resetPasswordSchema),
    authController.resetPassword.bind(authController)
);

// ============================================
// Protected Routes
// ============================================

// POST /auth/logout
router.post(
    '/logout',
    authenticate,
    validate(logoutSchema),
    authController.logout.bind(authController)
);

// POST /auth/change-password
router.post(
    '/change-password',
    authenticate,
    validate(changePasswordSchema),
    authController.changePassword.bind(authController)
);

export default router;
