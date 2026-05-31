import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
    env: string;
    port: number;
    apiVersion: string;
    database: {
        url: string;
    };
    redis: {
        url: string;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiry: string;
        refreshExpiry: string;
        issuer: string;
    };
    security: {
        bcryptRounds: number;
        rateLimitWindowMs: number;
        rateLimitMaxRequests: number;
        loginRateLimitMax: number;
    };
    cors: {
        origin: string | string[];
        credentials: boolean;
    };
    cookie: {
        domain: string;
        secure: boolean;
        sameSite: 'strict' | 'lax' | 'none';
    };
}

const config: Config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiVersion: process.env.API_VERSION || 'v1',

    database: {
        url: process.env.DATABASE_URL || '',
    },

    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-in-production',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
        issuer: process.env.JWT_ISSUER || 'https://auth.authforge.io',
    },

    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        loginRateLimitMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10),
    },

    cors: {
        origin: process.env.CORS_ORIGIN?.includes(',') 
            ? process.env.CORS_ORIGIN.split(',') 
            : (process.env.CORS_ORIGIN || 'http://localhost:3001'),
        credentials: process.env.CORS_CREDENTIALS === 'true',
    },

    cookie: {
        domain: process.env.COOKIE_DOMAIN || 'localhost',
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'strict',
    },
};

// Validation
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0 && config.env === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export default config;
