import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from '../entity';
import { LogModule } from '../log/log.module';
import { OutboxRepository } from './outbox.repository';
import { OutboxService } from './outbox.service';
import { OutboxScheduler } from './outbox.scheduler';
import { KafkaModule } from '../kafka';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity]), LogModule, KafkaModule],
  providers: [OutboxService, OutboxRepository, OutboxScheduler],
  exports: [OutboxService],
})
export class OutboxModule {}
