import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { ApiResponse, UserResponse, TokenPair } from '../types';
import config from '../config';

// ============================================
// AUTH CONTROLLER
// ============================================

class AuthController {
    // ============================================
    // POST /auth/signup
    // ============================================

    async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password, firstName, lastName, orgId } = req.body;
            const deviceInfo = this.extractDeviceInfo(req);

            const result = await authService.signup(
                email,
                password,
                firstName,
                lastName,
                orgId,
                deviceInfo
            );

            const response: ApiResponse<{ user: UserResponse; message: string }> = {
                success: true,
                data: result,
            };

            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // POST /auth/login
    // ============================================

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;
            const deviceInfo = this.extractDeviceInfo(req);

            const result = await authService.login(email, password, deviceInfo);

            // Set refresh token as HttpOnly cookie
            this.setRefreshTokenCookie(res, result.tokens.refreshToken);

            const response: ApiResponse<{
                access_token: string;
                token_type: string;
                expires_in: number;
                user: UserResponse;
            }> = {
                success: true,
                data: {
                    access_token: result.tokens.accessToken,
                    token_type: 'Bearer',
                    expires_in: result.tokens.expiresIn,
                    user: result.user,
                },
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // POST /auth/logout
    // ============================================

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { allSessions } = req.body;
            const user = req.user!;
            const deviceInfo = this.extractDeviceInfo(req);

            await authService.logout(
                user.sub,
                user.sessionId,
                user.jti,
                user.exp,
                allSessions,
                deviceInfo
            );

            // Clear refresh token cookie
            this.clearRefreshTokenCookie(res);

            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'Logged out successfully' },
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // POST /auth/refresh
    // ============================================

    async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Get refresh token from cookie or body
            const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;
            const deviceInfo = this.extractDeviceInfo(req);

            if (!refreshToken) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTH_TOKEN_INVALID',
                        message: 'Refresh token is required',
                    },
                });
                return;
            }

            const tokens = await authService.refreshToken(refreshToken, deviceInfo);

            // Set new refresh token cookie
            this.setRefreshTokenCookie(res, tokens.refreshToken);

            const response: ApiResponse<{
                access_token: string;
                token_type: string;
                expires_in: number;
            }> = {
                success: true,
                data: {
                    access_token: tokens.accessToken,
                    token_type: 'Bearer',
                    expires_in: tokens.expiresIn,
                },
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // POST /auth/verify-email
    // ============================================

    async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token } = req.body;

            await authService.verifyEmail(token);

            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'Email verified successfully' },
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // POST /auth/forgot-password
    // ============================================

    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;
            const deviceInfo = this.extractDeviceInfo(req);

            await authService.requestPasswordReset(email, deviceInfo);

            // Always return success to prevent email enumeration
            const response: ApiResponse<{ message: string }> = {
                success: true,
                data: { message: 'If the email exists, a password reset link will be sent' },
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // POST /auth/reset-password
    // ============================================

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token, password } = req.body;
            const deviceInfo = this.extractDeviceInfo(req);

            await authService.resetPassword(token, password, deviceInfo);

            res.status(200).json({
                status: 'success',
                data: { message: 'Password reset successfully' },
            });
        } catch (error) {
            next(error);
        }
    }

    // POST /auth/change-password
    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user?.id; // Assuming authenticate middleware attaches this

            if (!userId) {
                res.status(401).json({ status: 'error', message: 'Unauthorized' });
                return;
            }

            const deviceInfo = this.extractDeviceInfo(req);
            await authService.changePassword(userId, currentPassword, newPassword, deviceInfo);

            res.status(200).json({
                status: 'success',
                data: { message: 'Password changed successfully' },
            });
        } catch (error) {
            next(error);
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private extractDeviceInfo(req: Request) {
        return {
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            fingerprint: req.body.deviceInfo?.fingerprint,
            name: req.body.deviceInfo?.name,
        };
    }

    private setRefreshTokenCookie(res: Response, token: string): void {
        res.cookie('refresh_token', token, {
            httpOnly: true,
            secure: config.cookie.secure,
            sameSite: config.cookie.sameSite,
            domain: config.cookie.domain,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/api/v1/auth/refresh',
        });
    }

    private clearRefreshTokenCookie(res: Response): void {
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: config.cookie.secure,
            sameSite: config.cookie.sameSite,
            domain: config.cookie.domain,
            path: '/api/v1/auth/refresh',
        });
    }
}

export const authController = new AuthController();
export default AuthController;
