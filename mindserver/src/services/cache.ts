import Redis from 'ioredis';
import crypto from 'crypto';

// Types
export interface CacheValue {
    [key: string]: any;
}

export type CacheProvider = 'openai' | 'claude' | 'gemini';
export type CacheType = 'comp' | 'emb' | 'embed';

const redis = new Redis({
    host: 'redis',
    port: 6379
});

export class CacheService {
    /**
     * Creates a hash from the input data
     * @param data - The data to hash
     * @returns A hex string hash of the data
     */
    static hashRequest(data: Record<string, any>): string {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data, Object.keys(data).sort()))
            .digest('hex');
    }

    /**
     * Retrieves a value from cache
     * @param key - The cache key
     * @returns The cached value or null if not found
     */
    static async get<T>(key: string): Promise<T | null> {
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) as T : null;
    }

    /**
     * Sets a value in cache
     * @param key - The cache key
     * @param value - The value to cache
     */
    static async set(key: string, value: string | CacheValue): Promise<void> {
        await redis.set(key, JSON.stringify(value));
    }

    /**
     * Creates a cache key from the provided parameters
     * @param provider - The AI provider (openai, claude, gemini)
     * @param model - The model name
     * @param hash - The request hash
     * @param type - The cache type (comp, emb, embed)
     * @returns The formatted cache key
     */
    static createKey(
        provider: CacheProvider,
        model: string,
        hash: string,
        type: CacheType = 'comp'
    ): string {
        return `${type}:${provider}:${model}:${hash}`;
    }

    /**
     * Closes the Redis connection
     */
    static async close(): Promise<void> {
        await redis.quit();
    }
}
