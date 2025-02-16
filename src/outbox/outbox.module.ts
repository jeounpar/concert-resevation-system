import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from '../entity';
import { LogModule } from '../log/log.module';
import { OutboxRepository } from './outbox.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity]), LogModule],
  providers: [OutboxRepository],
  exports: [OutboxRepository],
})
export class OutboxModule {}
