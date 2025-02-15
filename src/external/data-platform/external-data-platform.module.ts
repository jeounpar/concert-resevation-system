import { Module } from '@nestjs/common';
import { LogModule } from '../../log/log.module';
import { ExternalDataPlatformEventHandler } from './external-data-platform-event-handler';

@Module({
  imports: [LogModule],
  providers: [ExternalDataPlatformEventHandler],
})
export class ExternalDataPlatformModule {}
