import { Global, Module } from '@nestjs/common';
import { RedisSpinLock } from './redis-spin-lock';

@Global()
@Module({
  providers: [RedisSpinLock],
  exports: [RedisSpinLock],
})
export class RedisSpinLockModule {}
