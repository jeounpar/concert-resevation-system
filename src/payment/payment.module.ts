import { Module } from '@nestjs/common';
import { PaymentController } from './controller/payment.controller';
import { PaymentFacade } from './service/payment.facade';
import { ConcertModule } from '../concert/concert.module';
import { PointModule } from '../point/point.module';

@Module({
  imports: [ConcertModule, PointModule],
  controllers: [PaymentController],
  providers: [PaymentFacade],
})
export class PaymentModule {}
