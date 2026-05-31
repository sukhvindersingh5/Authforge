import { redis } from '../config/redis';
import { AppError } from '../utils/errors';

// ============================================
// BRUTE FORCE PROTECTION SERVICE
// ============================================

interface BruteForceConfig {
    maxAttempts: number;
    windowSeconds: number;
    blockDurationSeconds: number;
}

const defaultConfig: BruteForceConfig = {
    maxAttempts: 5,
    windowSeconds: 900, // 15 minutes
    blockDurationSeconds: 1800, // 30 minutes
};

class BruteForceProtection {
    private config: BruteForceConfig;

    constructor(config: Partial<BruteForceConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    // ============================================
    // Check if IP/User is Blocked
    // ============================================

    async isBlocked(identifier: string): Promise<boolean> {
        const blockKey = `blocked:${identifier}`;
        const blocked = await redis.get(blockKey);
        return blocked !== null;
    }

    // ============================================
    // Record Failed Attempt
    // ============================================

    async recordFailedAttempt(identifier: string): Promise<{
        attempts: number;
        blocked: boolean;
        retryAfter?: number;
    }> {
        const attemptKey = `attempts:${identifier}`;
        const blockKey = `blocked:${identifier}`;

        // Check if already blocked
        const ttl = await redis.ttl(blockKey);
        if (ttl > 0) {
            return { attempts: this.config.maxAttempts, blocked: true, retryAfter: ttl };
        }

        // Increment attempts
        const attempts = await redis.incr(attemptKey);

        // Set expiry on first attempt
        if (attempts === 1) {
            await redis.expire(attemptKey, this.config.windowSeconds);
        }

        // Block if max attempts exceeded
        if (attempts >= this.config.maxAttempts) {
            await redis.set(blockKey, '1', 'EX', this.config.blockDurationSeconds);
            await redis.del(attemptKey);
            return {
                attempts,
                blocked: true,
                retryAfter: this.config.blockDurationSeconds
            };
        }

        return { attempts, blocked: false };
    }

    // ============================================
    // Reset on Successful Login
    // ============================================

    async resetAttempts(identifier: string): Promise<void> {
        const attemptKey = `attempts:${identifier}`;
        await redis.del(attemptKey);
    }

    // ============================================
    // Get Remaining Attempts
    // ============================================

    async getRemainingAttempts(identifier: string): Promise<number> {
        const attemptKey = `attempts:${identifier}`;
        const attempts = await redis.get(attemptKey);
        return this.config.maxAttempts - (parseInt(attempts || '0', 10));
    }
}

// ============================================
// IP-based Protection
// ============================================

export const ipBruteForce = new BruteForceProtection({
    maxAttempts: 10,
    windowSeconds: 900,
    blockDurationSeconds: 3600, // 1 hour
});

// ============================================
// Account-based Protection
// ============================================

export const accountBruteForce = new BruteForceProtection({
    maxAttempts: 5,
    windowSeconds: 900,
    blockDurationSeconds: 1800, // 30 minutes
});

// ============================================
// Check Brute Force Status
// ============================================

export async function checkBruteForce(ip: string, email?: string): Promise<void> {
    // Check IP block
    if (await ipBruteForce.isBlocked(ip)) {
        throw new AppError('RATE_LIMIT_EXCEEDED', {
            message: 'Too many requests from this IP. Please try again later.'
        });
    }

    // Check account block
    if (email && await accountBruteForce.isBlocked(email)) {
        throw new AppError('AUTH_ACCOUNT_LOCKED', {
            message: 'Account temporarily locked due to too many failed attempts.'
        });
    }
}

// ============================================
// Record Failed Login
// ============================================

export async function recordFailedLogin(ip: string, email?: string): Promise<void> {
    await ipBruteForce.recordFailedAttempt(ip);
    if (email) {
        await accountBruteForce.recordFailedAttempt(email);
    }
}

// ============================================
// Reset on Success
// ============================================

export async function resetBruteForce(ip: string, email: string): Promise<void> {
    await ipBruteForce.resetAttempts(ip);
    await accountBruteForce.resetAttempts(email);
}

export default BruteForceProtection;
