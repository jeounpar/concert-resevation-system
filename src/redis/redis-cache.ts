import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisCache {
  constructor(@InjectRedis() private readonly redisClient: Redis) {}

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const valueString = JSON.stringify(value);

    if (ttl) {
      await this.redisClient.set(key, valueString, 'EX', ttl);
    } else {
      await this.redisClient.set(key, valueString);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);

    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async flushAll(): Promise<void> {
    await this.redisClient.flushall();
  }
}
