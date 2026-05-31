import prisma from '../config/database';
import { AuditEventType, AuditLogEntry } from '../types';

// ============================================
// AUDIT SERVICE
// ============================================

class AuditService {
    // ============================================
    // Log Audit Event
    // ============================================

    async log(entry: AuditLogEntry): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: entry.userId,
                    eventType: entry.eventType,
                    ipAddress: entry.ipAddress,
                    userAgent: entry.userAgent,
                    metadata: (entry.metadata || {}) as object,
                },
            });
        } catch (error) {
            // Log to console but don't throw - audit logging shouldn't break main flow
            console.error('Failed to log audit event:', error);
        }
    }

    // ============================================
    // Query Audit Logs
    // ============================================

    async getLogsForUser(
        userId: string,
        options?: {
            eventTypes?: AuditEventType[];
            startDate?: Date;
            endDate?: Date;
            limit?: number;
            offset?: number;
        }
    ): Promise<Array<{
        id: string;
        eventType: string;
        ipAddress: string | null;
        metadata: unknown;
        createdAt: Date;
    }>> {
        const { eventTypes, startDate, endDate, limit = 50, offset = 0 } = options || {};

        const logs = await prisma.auditLog.findMany({
            where: {
                userId,
                eventType: eventTypes ? { in: eventTypes } : undefined,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                id: true,
                eventType: true,
                ipAddress: true,
                metadata: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        return logs;
    }

    // ============================================
    // Security Event Detection
    // ============================================

    async getRecentFailedLogins(
        userId: string,
        windowMinutes: number = 15
    ): Promise<number> {
        const since = new Date(Date.now() - windowMinutes * 60 * 1000);

        const count = await prisma.auditLog.count({
            where: {
                userId,
                eventType: AuditEventType.LOGIN_FAILED,
                createdAt: { gte: since },
            },
        });

        return count;
    }

    async getRecentLoginLocations(
        userId: string,
        limit: number = 5
    ): Promise<Array<{ ipAddress: string | null; createdAt: Date }>> {
        const logins = await prisma.auditLog.findMany({
            where: {
                userId,
                eventType: AuditEventType.LOGIN_SUCCESS,
            },
            select: {
                ipAddress: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return logins;
    }
}

export const auditService = new AuditService();
export default AuditService;
