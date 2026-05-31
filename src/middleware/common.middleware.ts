import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError, ErrorCodes } from '../utils/errors';
import { ApiResponse } from '../types';

// ============================================
// Request Validation Middleware
// ============================================

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const details = error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                next(new AppError('VALIDATION_ERROR', details));
            } else {
                next(error);
            }
        }
    };
}

// ============================================
// Error Handler Middleware
// ============================================

export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
): void {
    console.error(`[Error] ${req.method} ${req.path}:`, error);

    let response: ApiResponse;
    let statusCode: number;

    if (error instanceof AppError) {
        statusCode = error.status;
        response = {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
                requestId: req.requestId,
            },
        };
    } else {
        statusCode = 500;
        response = {
            success: false,
            error: {
                code: ErrorCodes.INTERNAL_ERROR.code,
                message: process.env.NODE_ENV === 'production'
                    ? ErrorCodes.INTERNAL_ERROR.message
                    : error.message,
                requestId: req.requestId,
            },
        };
    }

    res.status(statusCode).json(response);
}

// ============================================
// Not Found Handler
// ============================================

export function notFoundHandler(
    req: Request,
    res: Response
): void {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
            requestId: req.requestId,
        },
    });
}

// ============================================
// Request ID Middleware
// ============================================

export function requestId(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const id = req.headers['x-request-id'] as string || crypto.randomUUID();
    req.requestId = id;
    res.setHeader('x-request-id', id);
    next();
}

// ============================================
// Request Logger Middleware
// ============================================

export function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
        );
    });

    next();
}
