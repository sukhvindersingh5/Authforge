import argon2 from 'argon2';
import crypto from 'crypto';

// ============================================
// Password Hashing with Argon2id
// ============================================

export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,      // 64 MB
        timeCost: 3,            // 3 iterations
        parallelism: 4,         // 4 parallel threads
    });
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
}

// ============================================
// Token Generation
// ============================================

export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

export function generateTokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// ============================================
// Timing-Safe Comparison
// ============================================

export function timingSafeEqual(a: string, b: string): boolean {
    try {
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
        return false;
    }
}

// ============================================
// UUID Generation
// ============================================

export function generateUUID(): string {
    return crypto.randomUUID();
}

// ============================================
// Sanitization
// ============================================

export function sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

export function sanitizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
}
