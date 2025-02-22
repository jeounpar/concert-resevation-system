import { Module } from '@nestjs/common';
import { PaymentController } from './controller/payment.controller';
import { PaymentFacade } from './service/payment.facade';
import { ConcertModule } from '../concert/concert.module';
import { PointModule } from '../point/point.module';
import { TokenModule } from '../token/token.module';
import { LogModule } from '../../log/log.module';
import { PaymentKafkaConsumer } from './controller/payment-kafka.consumer';
import { KafkaModule } from '../../kafka';
import { OutboxModule } from '../../outbox';

@Module({
  imports: [
    ConcertModule,
    PointModule,
    TokenModule,
    KafkaModule,
    OutboxModule,
    LogModule,
  ],
  controllers: [PaymentController, PaymentKafkaConsumer],
  providers: [PaymentFacade],
})
export class PaymentModule {}
