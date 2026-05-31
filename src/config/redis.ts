import Redis from 'ioredis';
import config from '../config';

class RedisClient {
    private static instance: Redis | null = null;

    static getInstance(): Redis {
        if (!this.instance) {
            this.instance = new Redis(config.redis.url, {
                maxRetriesPerRequest: 3,
                lazyConnect: true,
            });

            this.instance.on('error', (err) => {
                console.error('Redis connection error:', err);
            });

            this.instance.on('connect', () => {
                console.log('✓ Connected to Redis');
            });
        }
        return this.instance;
    }

    static async disconnect(): Promise<void> {
        if (this.instance) {
            await this.instance.quit();
            this.instance = null;
        }
    }
}

export const redis = RedisClient.getInstance();
export default RedisClient;
