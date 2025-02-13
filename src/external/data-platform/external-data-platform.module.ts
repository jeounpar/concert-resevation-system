import { Module } from '@nestjs/common';
import { ExternalDataPlatformListener } from './external-data-platform.listener';
import { LogModule } from '../../log/log.module';

@Module({
  imports: [LogModule],
  providers: [ExternalDataPlatformListener],
})
export class ExternalDataPlatformModule {}
