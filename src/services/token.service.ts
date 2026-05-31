import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { redis } from '../config/redis';
import prisma from '../config/database';
import { TokenPayload, TokenPair } from '../types';
import { generateSecureToken, generateTokenHash } from '../utils/crypto';
import { AppError } from '../utils/errors';

// ============================================
// TOKEN SERVICE
// ============================================

class TokenService {
    private readonly accessSecret: string;
    private readonly refreshSecret: string;
    private readonly accessExpiry: string;
    private readonly refreshExpiry: string;
    private readonly issuer: string;

    constructor() {
        this.accessSecret = config.jwt.accessSecret;
        this.refreshSecret = config.jwt.refreshSecret;
        this.accessExpiry = config.jwt.accessExpiry;
        this.refreshExpiry = config.jwt.refreshExpiry;
        this.issuer = config.jwt.issuer;
    }

    // ============================================
    // Generate Token Pair
    // ============================================

    async generateTokenPair(
        userId: string,
        sessionId: string,
        roles: string[],
        permissions: string[],
        orgId?: string
    ): Promise<TokenPair> {
        const jti = uuidv4();

        // Generate access token
        const accessToken = this.generateAccessToken({
            sub: userId,
            jti,
            sessionId,
            roles,
            permissions,
            orgId,
        });

        // Generate refresh token (opaque token stored in DB)
        const refreshToken = generateSecureToken(64);
        const refreshTokenHash = generateTokenHash(refreshToken);

        // Calculate expiry (parse duration string like "7d")
        const refreshExpiresAt = this.calculateExpiry(this.refreshExpiry);

        // Store refresh token in database
        await prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: refreshTokenHash,
                sessionId,
                expiresAt: refreshExpiresAt,
            },
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: this.parseExpiryToSeconds(this.accessExpiry),
        };
    }

    // ============================================
    // Generate Access Token
    // ============================================

    private generateAccessToken(payload: Omit<TokenPayload, 'iss' | 'aud' | 'exp' | 'iat'>): string {
        const expiresInSeconds = this.parseExpiryToSeconds(this.accessExpiry);
        const options: SignOptions = {
            algorithm: 'HS256',
            expiresIn: expiresInSeconds,
            issuer: this.issuer,
            audience: ['authforge-api'],
        };

        return jwt.sign(
            {
                sub: payload.sub,
                jti: payload.jti,
                sessionId: payload.sessionId,
                roles: payload.roles,
                permissions: payload.permissions,
                orgId: payload.orgId,
            },
            this.accessSecret,
            options
        );
    }

    // ============================================
    // Verify Access Token
    // ============================================

    async verifyAccessToken(token: string): Promise<TokenPayload> {
        try {
            const decoded = jwt.verify(token, this.accessSecret, {
                issuer: this.issuer,
                audience: 'authforge-api',
            }) as JwtPayload;

            // Check if token is blacklisted
            const isBlacklisted = await this.isTokenBlacklisted(decoded.jti as string);
            if (isBlacklisted) {
                throw new AppError('AUTH_TOKEN_INVALID');
            }

            return {
                sub: decoded.sub as string,
                jti: decoded.jti as string,
                iss: decoded.iss as string,
                aud: decoded.aud as string[],
                exp: decoded.exp as number,
                iat: decoded.iat as number,
                sessionId: decoded.sessionId as string,
                roles: decoded.roles as string[],
                permissions: decoded.permissions as string[],
                orgId: decoded.orgId as string | undefined,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            if (error instanceof jwt.TokenExpiredError) {
                throw new AppError('AUTH_TOKEN_EXPIRED');
            }
            throw new AppError('AUTH_TOKEN_INVALID');
        }
    }

    // ============================================
    // Verify Refresh Token
    // ============================================

    async verifyRefreshToken(refreshToken: string): Promise<{
        userId: string;
        sessionId: string;
        tokenId: string;
    }> {
        const tokenHash = generateTokenHash(refreshToken);

        const storedToken = await prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: true },
        });

        if (!storedToken) {
            throw new AppError('AUTH_TOKEN_INVALID');
        }

        if (storedToken.revoked) {
            // Token reuse detected - potential security breach
            // Revoke all tokens for this user's session
            await this.revokeSessionTokens(storedToken.sessionId);
            throw new AppError('AUTH_SESSION_REVOKED');
        }

        if (storedToken.expiresAt < new Date()) {
            throw new AppError('AUTH_REFRESH_EXPIRED');
        }

        return {
            userId: storedToken.userId,
            sessionId: storedToken.sessionId,
            tokenId: storedToken.id,
        };
    }

    // ============================================
    // Refresh Token Rotation
    // ============================================

    async rotateRefreshToken(
        oldRefreshToken: string,
        userId: string,
        sessionId: string,
        roles: string[],
        permissions: string[],
        orgId?: string
    ): Promise<TokenPair> {
        // Verify and get old token info
        const { tokenId } = await this.verifyRefreshToken(oldRefreshToken);

        // Revoke old refresh token
        await prisma.refreshToken.update({
            where: { id: tokenId },
            data: { revoked: true },
        });

        // Generate new token pair
        return this.generateTokenPair(userId, sessionId, roles, permissions, orgId);
    }

    // ============================================
    // Token Revocation
    // ============================================

    async revokeAccessToken(jti: string, expiresAt: number): Promise<void> {
        const ttl = expiresAt - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
            await redis.set(`blacklist:access:${jti}`, '1', 'EX', ttl);
        }
    }

    async revokeRefreshToken(tokenHash: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { tokenHash },
            data: { revoked: true },
        });
    }

    async revokeSessionTokens(sessionId: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { sessionId },
            data: { revoked: true },
        });
    }

    async revokeAllUserTokens(userId: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { userId },
            data: { revoked: true },
        });

        // Also delete all sessions
        await prisma.session.deleteMany({
            where: { userId },
        });
    }

    // ============================================
    // Blacklist Check
    // ============================================

    private async isTokenBlacklisted(jti: string): Promise<boolean> {
        const result = await redis.get(`blacklist:access:${jti}`);
        return result !== null;
    }

    // ============================================
    // Utility Methods
    // ============================================

    private calculateExpiry(duration: string): Date {
        const seconds = this.parseExpiryToSeconds(duration);
        return new Date(Date.now() + seconds * 1000);
    }

    private parseExpiryToSeconds(duration: string): number {
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) {
            return 900; // Default 15 minutes
        }

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 60 * 60;
            case 'd': return value * 60 * 60 * 24;
            default: return 900;
        }
    }
}

export const tokenService = new TokenService();
export default TokenService;
