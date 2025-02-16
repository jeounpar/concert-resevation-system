import { Injectable } from '@nestjs/common';
import { ConcertService } from '../../concert/service/concert.service';
import { PointService } from '../../point/service/point.service';
import { getDataSource } from '../../../config/typeorm-factory';
import { EntityManager } from 'typeorm';
import { TokenService } from '../../token/service/token.service';
import { MyCustomLogger } from '../../../log/my-custom-logger';
import { EventBus } from '@nestjs/cqrs';
import { ConcertPaymentSuccessEvent } from '../concert-payment-success-event';
import { v4 } from 'uuid';

@Injectable()
export class PaymentFacade {
  constructor(
    private readonly concertService: ConcertService,
    private readonly pointService: PointService,
    private readonly tokenService: TokenService,
    private readonly eventBus: EventBus,
    private readonly logger: MyCustomLogger,
  ) {}

  async concertPayment({ seatId, userId }: { seatId: number; userId: number }) {
    const nowDate = new Date();
    this.logger.log('concertPayment', 'payment start', { nowDate });

    return await getDataSource().transaction(async (mgr: EntityManager) => {
      const concertResponse = await this.concertService.paid({
        seatId,
        userId,
        nowDate,
        mgr,
      });

      this.logger.log('concertPayment', 'concertResponse result', {
        concertResponse,
      });

      const pointResponse = await this.pointService.use({
        userId,
        amount: concertResponse.price,
        mgr,
      });
      this.logger.log('concertPayment', 'pointResponse result', {
        pointResponse,
      });

      await this.tokenService.deleteTokenByUserId({ userId, mgr });
      this.logger.log('concertPayment', 'deleteTokenByUserId success', {
        userId,
      });

      this.eventBus.publish(
        new ConcertPaymentSuccessEvent({
          userId: concertResponse.userId,
          seatNumber: concertResponse.seatNumber,
          price: concertResponse.price,
          eventId: v4(),
        }),
      );

      return {
        concertInfo: concertResponse,
        pointInfo: pointResponse,
      };
    });
  }
}
