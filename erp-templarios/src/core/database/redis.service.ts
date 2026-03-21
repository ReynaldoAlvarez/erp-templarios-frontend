import Redis from 'ioredis';
import { config } from '../config';

// In-memory cache for development without Redis
class MemoryCache {
  private cache: Map<string, { value: string; expiry?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  async incr(key: string): Promise<number> {
    const current = parseInt((await this.get(key)) || '0') + 1;
    await this.set(key, current.toString());
    return current;
  }

  async pexpire(key: string, ms: number): Promise<void> {
    const item = this.cache.get(key);
    if (item) {
      item.expiry = Date.now() + ms;
    }
  }

  async pttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item || !item.expiry) return -1;
    return Math.max(0, item.expiry - Date.now());
  }
}

export class RedisService {
  private static instance: RedisService;
  private client: Redis | null = null;
  private memoryCache: MemoryCache = new MemoryCache();
  private isConnected: boolean = false;
  private useMemory: boolean = false;

  private constructor() {}

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    // Check if Redis URL is configured
    if (!config.redisUrl || config.redisUrl === 'redis://localhost:6379') {
      console.log('⚠️ Redis URL not configured, using in-memory cache');
      this.useMemory = true;
      this.isConnected = true;
      return;
    }

    try {
      this.client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
      });

      await this.client.ping();
      this.isConnected = true;
      this.useMemory = false;
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.log('⚠️ Redis connection failed, using in-memory cache:', error);
      this.useMemory = true;
      this.isConnected = true;
    }
  }

  public isRedisConnected(): boolean {
    return this.isConnected && !this.useMemory;
  }

  public isUsingMemoryCache(): boolean {
    return this.useMemory;
  }

  private getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  // Generic operations
  public async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useMemory) {
        const value = await this.memoryCache.get(key);
        return value ? JSON.parse(value) : null;
      }
      const value = await this.getClient().get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  public async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.useMemory) {
      await this.memoryCache.set(key, serialized, ttlSeconds);
      return;
    }
    if (ttlSeconds) {
      await this.getClient().setex(key, ttlSeconds, serialized);
    } else {
      await this.getClient().set(key, serialized);
    }
  }

  public async del(key: string): Promise<void> {
    if (this.useMemory) {
      await this.memoryCache.del(key);
      return;
    }
    await this.getClient().del(key);
  }

  public async exists(key: string): Promise<boolean> {
    if (this.useMemory) {
      return this.memoryCache.exists(key);
    }
    const result = await this.getClient().exists(key);
    return result === 1;
  }

  // Session operations
  public async setSession(sessionId: string, data: unknown, ttlSeconds: number): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttlSeconds);
  }

  public async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Rate limiting
  public async incrementRateLimit(key: string, windowMs: number): Promise<number> {
    if (this.useMemory) {
      const current = await this.memoryCache.incr(key);
      if (current === 1) {
        await this.memoryCache.pexpire(key, windowMs);
      }
      return current;
    }
    const current = await this.getClient().incr(key);
    if (current === 1) {
      await this.getClient().pexpire(key, windowMs);
    }
    return current;
  }

  public async getRateLimitTTL(key: string): Promise<number> {
    if (this.useMemory) {
      return this.memoryCache.pttl(key);
    }
    return this.getClient().pttl(key);
  }
}

export default RedisService;
