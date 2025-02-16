import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OutboxRepository } from './outbox.repository';
import { ConcertPaymentSuccessPayload } from '../api/payment/concert-payment-success-event';
import { OutboxDomain } from './outbox.domain';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class OutboxService {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async changeStatusToPublished({
    eventId,
    mgr,
  }: {
    eventId: string;
    mgr?: EntityManager;
  }) {
    const outbox = await this.outboxRepository
      .findOne(mgr)
      .eventIdWithInitStatus(eventId);
    if (!outbox) return;

    outbox.published();
    await this.outboxRepository.save({ domain: outbox, mgr });
  }

  async createInitOutbox({
    payload,
    mgr,
  }: {
    payload: ConcertPaymentSuccessPayload;
    mgr?: EntityManager;
  }) {
    const outbox = OutboxDomain.createInitOutbox({ payload });
    await this.outboxRepository.save({ domain: outbox, mgr });
  }

  async publishInitStatusMessage({
    nowDate,
    mgr,
  }: {
    nowDate: Date;
    mgr?: EntityManager;
  }) {
    const outboxDomains = await this.outboxRepository
      .findMany(mgr)
      .initStatus();

    outboxDomains
      .filter((e) => e.isExpired({ nowDate }))
      .forEach((e) => e.published());

    await this.outboxRepository.bulkSave({ domains: outboxDomains, mgr });

    await Promise.all(
      outboxDomains.map((e) =>
        this.kafkaClient.emit('CONCERT_PAYMENT_RESERVATION_SUCCESS', e.payload),
      ),
    );
  }
}
