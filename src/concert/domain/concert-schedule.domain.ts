import { SeatDomain } from './seat.domain';
import { ConcertScheduleEntity } from '../../entity';

export class ConcertScheduleDomain {
  #id: number;
  #concertId: number;
  #theDateString: string;
  #createDate: Date;
  #updateDate: Date | null;
  #seats: SeatDomain[];

  static fromEntity(entity: ConcertScheduleEntity): ConcertScheduleDomain {
    const domain = new ConcertScheduleDomain();

    domain.#id = entity.id;
    domain.#concertId = entity.concertId;
    domain.#theDateString = entity.theDateString;
    domain.#createDate = entity.createDate;
    domain.#updateDate = entity.updateDate;
    domain.#seats = entity.seats ? entity.seats.map(SeatDomain.fromEntity) : [];

    return domain;
  }

  toEntity() {
    const entity = new ConcertScheduleEntity();

    entity.concertId = this.#concertId;
    entity.theDateString = this.#theDateString;

    return entity;
  }

  toResponse() {
    return {
      concertScheduleId: this.#id,
      concertId: this.#concertId,
      theDateString: this.#theDateString,
      seatInfo: this.#seats.map((e) => e.toInfo()),
    };
  }

  get id(): number {
    return this.#id;
  }
}
