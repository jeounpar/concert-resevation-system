import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { CONCERT_POLICY } from '../../policy';
import { ConcertService } from '../service/concert.service';

@Injectable()
export class ConcertScheduler {
  constructor(private readonly concertService: ConcertService) {}

  @Interval(CONCERT_POLICY.SCHEDULE_INTERVAL_DELETE_EXPIRED_SEAT)
  async changeStatusToEmptyWithExpiredSeat() {
    const nowDate = new Date();

    await this.concertService.changeStatusToEmptyWithExpiredSeat({ nowDate });
  }
}
