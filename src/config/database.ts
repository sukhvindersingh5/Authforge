import { PrismaClient } from '@prisma/client';
import config from '../config';

// Prevent multiple instances in development
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
    log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (config.env !== 'production') {
    global.prisma = prisma;
}

export default prisma;
