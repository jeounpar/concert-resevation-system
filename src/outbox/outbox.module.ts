import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from '../entity';
import { LogModule } from '../log/log.module';
import { OutboxRepository } from './outbox.repository';
import { OutboxService } from './outbox.service';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity]), LogModule],
  providers: [OutboxService, OutboxRepository],
  exports: [OutboxService],
})
export class OutboxModule {}
