import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { getDataSource } from '../config/typeorm-factory';
import Redis from 'ioredis';
import { LockAcquiredFailed } from '../error';

@Injectable()
export class RedisSpinLock {
  constructor(@InjectRedis() private readonly redisClient: Redis) {}

  async acquireLock(key: string, ttl: number): Promise<boolean> {
    const lockKey = `redis-lock:${key}`;
    const setResult = await this.redisClient.setnx(lockKey, 'locked');

    if (setResult === 1) {
      await this.redisClient.pexpire(lockKey, ttl);
      return true;
    }
    return false;
  }

  async releaseLock(key: string): Promise<void> {
    const lockKey = `redis-lock:${key}`;
    await this.redisClient.del(lockKey);
  }
}

export function SpinLockWithTransaction(
  baseLockKeyName: string,
  ttl: number = 5000,
  maxRetries: number = 10,
  retryDelay: number = 100,
) {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const redisSpinLock: RedisSpinLock = this.redisSpinLock;

      const { seatId } = args[0];
      const lockKey = `${baseLockKeyName}:${seatId}`;

      let lockAcquired = false;
      let retries = 0;

      while (retries < maxRetries) {
        lockAcquired = await redisSpinLock.acquireLock(lockKey, ttl);
        if (lockAcquired) break;

        retries++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }

      if (!lockAcquired) {
        throw new LockAcquiredFailed(
          `Failed to acquire lock after ${maxRetries} retries: ${lockKey}`,
        );
      }

      try {
        return await getDataSource().transaction(async (entityManager) => {
          return await originalMethod.apply(this, [...args, entityManager]);
        });
      } finally {
        await redisSpinLock.releaseLock(lockKey);
      }
    };

    return descriptor;
  };
}
