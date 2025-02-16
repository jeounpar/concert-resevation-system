import { Module } from '@nestjs/common';
import { LogModule } from '../../log/log.module';
import { ExternalDataPlatformEventHandler } from './external-data-platform-event-handler';
import { KafkaModule } from '../../kafka';
import { OutboxModule } from '../../outbox';

@Module({
  imports: [LogModule, KafkaModule, OutboxModule],
  providers: [ExternalDataPlatformEventHandler],
})
export class ExternalDataPlatformModule {}
