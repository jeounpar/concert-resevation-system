import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { getDataSource } from '../config/typeorm-factory';
import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxScheduler {
  constructor(private readonly outboxService: OutboxService) {}

  @Interval(1_000 * 5)
  async deleteExpiredToken() {
    const nowDate = new Date();

    await getDataSource().transaction(async (mgr) => {
      await this.outboxService.publishInitStatusMessage({ nowDate, mgr });
    });
  }
}
