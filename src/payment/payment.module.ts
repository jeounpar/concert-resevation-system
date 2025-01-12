import { Module } from '@nestjs/common';
import { PaymentController } from './controller/payment.controller';
import { PaymentFacade } from './service/payment.facade';
import { ConcertModule } from '../concert/concert.module';
import { PointModule } from '../point/point.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [ConcertModule, PointModule, TokenModule],
  controllers: [PaymentController],
  providers: [PaymentFacade],
})
export class PaymentModule {}
