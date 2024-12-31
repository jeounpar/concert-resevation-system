import { Global, Module } from '@nestjs/common';
import { ConfigReader } from './config.reader';
import { DatabaseConfig } from './config.database';

@Global()
@Module({
  providers: [ConfigReader, DatabaseConfig],
  exports: [ConfigReader, DatabaseConfig],
})
export class ConfigModule {}
