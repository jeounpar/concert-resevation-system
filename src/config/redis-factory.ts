import { RedisOptions } from 'ioredis';
import { RedisConfig } from './config.redis';
import { RedisModuleOptions } from '@nestjs-modules/ioredis';

export function redisOptionsFactory(config: RedisConfig): RedisModuleOptions {
  const { host, port, password } = config;

  const options: RedisOptions = {
    host,
    port,
    password,
    retryStrategy: (times) => {
      console.warn(`Retrying Redis connection attempt #${times}`);
      return Math.min(times * 100, 3000);
    },
  };

  return {
    type: 'single',
    options,
  };
}
