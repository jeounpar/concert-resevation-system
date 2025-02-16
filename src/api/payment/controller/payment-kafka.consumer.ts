import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';
import { ConcertPaymentSuccessPayload } from '../concert-payment-success-event';
import { OutboxRepository } from '../../../outbox/outbox.repository';
import { getDataSource } from '../../../config/typeorm-factory';

@Controller()
export class PaymentKafkaConsumer implements OnModuleInit {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  @MessagePattern('CONCERT_PAYMENT_RESERVATION_SUCCESS')
  async handleMessage(@Payload() payload: ConcertPaymentSuccessPayload) {
    await getDataSource().transaction(async (mgr) => {
      const outbox = await this.outboxRepository
        .findOne(mgr)
        .eventIdWithInitStatus(payload.eventId);
      if (!outbox) return;

      outbox.published();
      await this.outboxRepository.save({ domain: outbox, mgr });
    });
  }
}
