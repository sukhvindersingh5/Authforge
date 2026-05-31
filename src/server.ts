import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import config from './config';
import routes from './routes';
import {
    apiRateLimiter,
    errorHandler,
    notFoundHandler,
    requestId,
    requestLogger
} from './middleware';

// ============================================
// Express App Setup
// ============================================

const app = express();

// ============================================
// Security Middleware
// ============================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// ============================================
// Request Processing Middleware
// ============================================

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse cookies
app.use(cookieParser());

// Request ID tracking
app.use(requestId);

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(apiRateLimiter);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ============================================
// API Routes
// ============================================

app.use(`/api/${config.apiVersion}`, routes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================

const startServer = async (): Promise<void> => {
    try {
        // Test database connection
        const { default: prisma } = await import('./config/database');
        await prisma.$connect();
        console.log('✓ Database connected');

        // Test Redis connection
        const { redis } = await import('./config/redis');
        await redis.ping();
        console.log('✓ Redis connected');

        // Start server
        app.listen(config.port, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚡ AuthForge Server                                     ║
║                                                           ║
║   Environment: ${config.env.padEnd(40)}║
║   Port: ${String(config.port).padEnd(47)}║
║   API Version: ${config.apiVersion.padEnd(40)}║
║                                                           ║
║   Endpoints:                                              ║
║   - POST /api/${config.apiVersion}/auth/signup                            ║
║   - POST /api/${config.apiVersion}/auth/login                             ║
║   - POST /api/${config.apiVersion}/auth/logout                            ║
║   - POST /api/${config.apiVersion}/auth/refresh                           ║
║   - GET  /api/${config.apiVersion}/users/me                               ║
║   - GET  /api/${config.apiVersion}/health                                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    const { default: prisma } = await import('./config/database');
    await prisma.$disconnect();
    const { default: RedisClient } = await import('./config/redis');
    await RedisClient.disconnect();
    process.exit(0);
});

startServer();

export default app;
