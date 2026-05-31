import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/server';
import prisma from '../src/config/database';
import { redis } from '../src/config/redis';

// ============================================
// AUTH FLOW TESTS
// ============================================

describe('Authentication Flow', () => {
    const testUser = {
        email: 'test@example.com',
        password: 'TestP@ssw0rd!23',
        firstName: 'Test',
        lastName: 'User',
    };

    let accessToken: string;
    let refreshTokenCookie: string;

    beforeAll(async () => {
        // Clear test data
        await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({ where: { email: testUser.email } });
        await redis.quit();
        await prisma.$disconnect();
    });

    // ============================================
    // Signup Tests
    // ============================================

    describe('POST /api/v1/auth/signup', () => {
        it('should create a new user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/signup')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.body.data.user.emailVerified).toBe(false);
        });

        it('should reject duplicate email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/signup')
                .send(testUser);

            expect(res.status).toBe(409);
            expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');
        });

        it('should reject weak password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/signup')
                .send({ ...testUser, email: 'weak@test.com', password: '123456' });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    // ============================================
    // Login Tests
    // ============================================

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            // Activate user for login tests
            await prisma.user.update({
                where: { email: testUser.email },
                data: { status: 'ACTIVE', emailVerified: true },
            });
        });

        it('should login successfully', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: testUser.email, password: testUser.password });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.access_token).toBeDefined();
            expect(res.body.data.token_type).toBe('Bearer');
            expect(res.headers['set-cookie']).toBeDefined();

            accessToken = res.body.data.access_token;
            refreshTokenCookie = res.headers['set-cookie'][0];
        });

        it('should reject invalid password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: testUser.email, password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
        });

        it('should reject non-existent user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'noone@test.com', password: 'password' });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
        });
    });

    // ============================================
    // Protected Route Tests
    // ============================================

    describe('GET /api/v1/users/me', () => {
        it('should return user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/v1/users/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe(testUser.email);
        });

        it('should reject request without token', async () => {
            const res = await request(app).get('/api/v1/users/me');

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('AUTH_TOKEN_INVALID');
        });

        it('should reject request with invalid token', async () => {
            const res = await request(app)
                .get('/api/v1/users/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // Token Refresh Tests
    // ============================================

    describe('POST /api/v1/auth/refresh', () => {
        it('should refresh tokens with valid refresh token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .set('Cookie', refreshTokenCookie);

            expect(res.status).toBe(200);
            expect(res.body.data.access_token).toBeDefined();
            expect(res.body.data.access_token).not.toBe(accessToken);
        });

        it('should reject refresh without token', async () => {
            const res = await request(app).post('/api/v1/auth/refresh');

            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // Logout Tests
    // ============================================

    describe('POST /api/v1/auth/logout', () => {
        it('should logout successfully', async () => {
            const res = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ allSessions: false });

            expect(res.status).toBe(200);
            expect(res.body.data.message).toBe('Logged out successfully');
        });

        it('should reject requests with revoked token', async () => {
            const res = await request(app)
                .get('/api/v1/users/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(401);
        });
    });
});

// ============================================
// RATE LIMITING TESTS
// ============================================

describe('Rate Limiting', () => {
    it('should rate limit excessive login attempts', async () => {
        const attempts = Array.from({ length: 10 }, () =>
            request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'ratelimit@test.com', password: 'wrongpass' })
        );

        const responses = await Promise.all(attempts);
        const rateLimited = responses.filter(r => r.status === 429);

        expect(rateLimited.length).toBeGreaterThan(0);
    });
});

// ============================================
// SECURITY TESTS
// ============================================

describe('Security Headers', () => {
    it('should include security headers', async () => {
        const res = await request(app).get('/api/v1/health');

        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('DENY');
        expect(res.headers['x-xss-protection']).toBeDefined();
    });
});
