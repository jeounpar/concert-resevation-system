import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';
import { ConcertPaymentSuccessPayload } from '../concert-payment-success-event';
import { getDataSource } from '../../../config/typeorm-factory';
import { OutboxService } from '../../../outbox';

@Controller()
export class PaymentKafkaConsumer implements OnModuleInit {
  constructor(
    private readonly outboxService: OutboxService,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  @MessagePattern('CONCERT_PAYMENT_RESERVATION_SUCCESS')
  async handleMessage(@Payload() payload: ConcertPaymentSuccessPayload) {
    await getDataSource().transaction(async (mgr) => {
      await this.outboxService.changeStatusToPublished({
        eventId: payload.eventId,
        mgr,
      });
    });
  }
}
