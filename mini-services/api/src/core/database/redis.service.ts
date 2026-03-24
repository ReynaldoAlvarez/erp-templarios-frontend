import Redis from 'ioredis';
import { config } from '../config';

export class RedisService {
  private static instance: RedisService;
  private client: Redis | null = null;
  private isConnected: boolean = false;

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

    try {
      this.client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 100, 2000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('Redis connected');
      });

      this.client.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });

      await this.client.ping();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  public getClient(): Redis {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  // Cache operations
  public async get<T>(key: string): Promise<T | null> {
    const data = await this.getClient().get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  public async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.getClient().setex(key, ttlSeconds, stringValue);
    } else {
      await this.getClient().set(key, stringValue);
    }
  }

  public async del(key: string): Promise<void> {
    await this.getClient().del(key);
  }

  public async exists(key: string): Promise<boolean> {
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
    const client = this.getClient();
    const current = await client.incr(key);
    if (current === 1) {
      await client.pexpire(key, windowMs);
    }
    return current;
  }

  public async getRateLimitTTL(key: string): Promise<number> {
    return this.getClient().pttl(key);
  }
}

export default RedisService;
