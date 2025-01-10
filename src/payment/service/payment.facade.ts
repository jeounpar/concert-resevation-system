import { Injectable } from '@nestjs/common';
import { ConcertService } from '../../concert/service/concert.service';
import { PointService } from '../../point/service/point.service';
import { getDataSource } from '../../config/typeorm-factory';
import { EntityManager } from 'typeorm';
import { TokenService } from '../../token/service/token.service';

@Injectable()
export class PaymentFacade {
  constructor(
    private readonly concertService: ConcertService,
    private readonly pointService: PointService,
    private readonly tokenService: TokenService,
  ) {}

  async concertPayment({ seatId, userId }: { seatId: number; userId: number }) {
    const nowDate = new Date();

    return await getDataSource().transaction(async (mgr: EntityManager) => {
      const concertResponse = await this.concertService.paid({
        seatId,
        userId,
        nowDate,
        mgr,
      });
      const pointResponse = await this.pointService.use({
        userId,
        amount: concertResponse.price,
        mgr,
      });
      await this.tokenService.deleteTokenByUserId({ userId, mgr });

      return {
        concertInfo: concertResponse,
        pointInfo: pointResponse,
      };
    });
  }
}
