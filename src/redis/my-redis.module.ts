import { Global, Module } from '@nestjs/common';
import { RedisSpinLock } from './redis-spin-lock';
import { RedisCache } from './redis-cache';
import { RedisTokenQueue } from './redis-token-queue';

@Global()
@Module({
  providers: [RedisSpinLock, RedisCache, RedisTokenQueue],
  exports: [RedisSpinLock, RedisCache, RedisTokenQueue],
})
export class MyRedisModule {}
