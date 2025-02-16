import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OutboxRepository } from './outbox.repository';
import { ConcertPaymentSuccessPayload } from '../api/payment/concert-payment-success-event';
import { OutboxDomain } from './outbox.domain';

@Injectable()
export class OutboxService {
  constructor(private readonly outboxRepository: OutboxRepository) {}

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
}
