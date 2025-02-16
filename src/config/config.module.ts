import { Global, Module } from '@nestjs/common';
import { ConfigReader } from './config.reader';
import { DatabaseConfig } from './config.database';
import { RedisConfig } from './config.redis';
import { KafkaConfig } from './config.kafka';

@Global()
@Module({
  providers: [ConfigReader, DatabaseConfig, RedisConfig, KafkaConfig],
  exports: [ConfigReader, DatabaseConfig, RedisConfig, KafkaConfig],
})
export class ConfigModule {}
