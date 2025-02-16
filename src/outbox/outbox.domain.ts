import { OutboxEntity, OutboxStatus } from '../entity';

export class OutboxDomain {
  #id: number;
  #payload: any;
  #status: OutboxStatus;
  #createDate: Date;

  static fromEntity(entity: OutboxEntity): OutboxDomain {
    const domain = new OutboxDomain();

    domain.#id = entity.id;
    domain.#payload = entity.payload;
    domain.#status = entity.status;
    domain.#createDate = entity.createDate;

    return domain;
  }

  static createInitOutbox({ payload }: { payload: any }) {
    const domain = new OutboxDomain();

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
    entity.payload = this.#payload;
    entity.status = this.#status;

    return entity;
  }
}
