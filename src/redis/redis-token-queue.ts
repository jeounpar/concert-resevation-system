import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { getCacheKey } from './index';
import { TOKEN_POLICY } from '../policy';
import { TokenExpired, TokenNotFound } from '../error';

export interface RedisUserToken {
  userId: number;
  timestamp: number;
}

@Injectable()
export class RedisTokenQueue {
  private readonly waitingQueueKey = getCacheKey('WAITING_QUEUE');
  private readonly activeTokensKey = getCacheKey('ACTIVE_TOKENS');

  constructor(@InjectRedis() private readonly redisClient: Redis) {}

  async add({
    userId,
    nowDate,
  }: {
    userId: number;
    nowDate: Date;
  }): Promise<void> {
    await this.redisClient.zadd(
      this.waitingQueueKey,
      nowDate.getTime(),
      userId.toString(),
    );
  }

  async pop(): Promise<RedisUserToken[]> {
    const poppedUsers = await this.redisClient.zpopmin(
      this.waitingQueueKey,
      TOKEN_POLICY.TO_BE_ACTIVE_TOKEN_COUNT,
    );

    return poppedUsers.reduce<RedisUserToken[]>((acc, value, index, array) => {
      if (index % 2 === 0) {
        acc.push({
          userId: Number(value),
          timestamp: Number(array[index + 1]),
        });
      }
      return acc;
    }, []);
  }

  async active(users: RedisUserToken[]): Promise<void> {
    if (!users.length) return;

    const userTimestampPairs = users.map(
      ({ userId, timestamp }) => `${userId}:${timestamp}`,
    );
    await this.redisClient.sadd(this.activeTokensKey, ...userTimestampPairs);
  }

  async rank({ userId }: { userId: number }): Promise<number | null> {
    const rank = await this.redisClient.zrank(
      this.waitingQueueKey,
      userId.toString(),
    );
    return rank !== null ? rank + 1 : null;
  }

  async removeActiveTokenByUserId({
    userId,
  }: {
    userId: number;
  }): Promise<void> {
    const activeTokens = await this.redisClient.smembers(this.activeTokensKey);

    const userToken = activeTokens.find((token) =>
      token.startsWith(`${userId}:`),
    );
    if (!userToken) return;

    await this.redisClient.srem(this.activeTokensKey, userToken);
  }

  async removeExpiredActiveTokens({
    nowDate,
  }: {
    nowDate: Date;
  }): Promise<void> {
    const now = nowDate.getTime();
    const activeTokens = await this.redisClient.smembers(this.activeTokensKey);

    const expiredTokens = activeTokens.filter((token) => {
      const [, timestampStr] = token.split(':');
      const timestamp = Number(timestampStr);
      return now - timestamp > TOKEN_POLICY.EXPIRED_TIME_MS;
    });

    if (expiredTokens.length > 0)
      await this.redisClient.srem(this.activeTokensKey, ...expiredTokens);
  }

  async validateToken({ userId }: { userId: number }): Promise<void> {
    const activeTokens = await this.redisClient.smembers(this.activeTokensKey);

    if (!activeTokens.some((token) => token.startsWith(`${userId}:`))) {
      throw new TokenNotFound(`userId=${userId} token not found`);
    }
  }
}
