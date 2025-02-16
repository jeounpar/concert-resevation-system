import { OutboxEntity, OutboxStatus } from '../entity';
import { ConcertPaymentSuccessPayload } from '../api/payment/concert-payment-success-event';

export class OutboxDomain {
  #id: number;
  #eventId: string;
  #payload: any;
  #status: OutboxStatus;
  #createDate: Date;

  static fromEntity(entity: OutboxEntity): OutboxDomain {
    const domain = new OutboxDomain();

    domain.#id = entity.id;
    domain.#eventId = entity.eventId;
    domain.#payload = entity.payload;
    domain.#status = entity.status;
    domain.#createDate = entity.createDate;

    return domain;
  }

  static createInitOutbox({
    payload,
  }: {
    payload: ConcertPaymentSuccessPayload;
  }) {
    const domain = new OutboxDomain();

    domain.#eventId = payload.eventId;
    domain.#payload = payload;
    domain.#status = 'INIT';

    return domain;
  }

  published() {
    this.#status = 'PUBLISHED';
  }

  toEntity(): OutboxEntity {
    const entity = new OutboxEntity();

    entity.id = this.#id;
    entity.eventId = this.#eventId;
    entity.payload = this.#payload;
    entity.status = this.#status;

    return entity;
  }

  isExpired({ nowDate }: { nowDate: Date }): boolean {
    return this.#createDate.getTime() + 5 * 60 * 1000 < nowDate.getTime();
  }

  get payload(): any {
    return this.#payload;
  }
}
