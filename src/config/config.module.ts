import { Global, Module } from '@nestjs/common';
import { ConfigReader } from './config.reader';
import { DatabaseConfig } from './config.database';
import { RedisConfig } from './config.redis';

@Global()
@Module({
  providers: [ConfigReader, DatabaseConfig, RedisConfig],
  exports: [ConfigReader, DatabaseConfig, RedisConfig],
})
export class ConfigModule {}
