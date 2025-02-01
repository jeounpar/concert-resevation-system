import { Global, Module } from '@nestjs/common';
import { RedisSpinLock } from './redis-spin-lock';
import { RedisCache } from './redis-cache';

@Global()
@Module({
  providers: [RedisSpinLock, RedisCache],
  exports: [RedisSpinLock, RedisCache],
})
export class MyRedisModule {}
