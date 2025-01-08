import { SeatEntity, SeatStatus } from '../../entity';
import { CannotReserveError } from '../../error';
import * as dayjs from 'dayjs';
import { CONCERT_POLICY } from '../../policy';

export class SeatDomain {
  #id: number;
  #userId: number | null;
  #concertScheduleId: number;
  #seatNumber: number;
  #status: SeatStatus;
  #price: number;
  #createDate: Date;
  #expireDate: Date | null;
  #updateDate: Date | null;

  static fromEntity(entity: SeatEntity): SeatDomain {
    const domain = new SeatDomain();

    domain.#id = entity.id;
    domain.#userId = entity.userId;
    domain.#concertScheduleId = entity.concertScheduleId;
    domain.#seatNumber = entity.seatNumber;
    domain.#status = entity.status;
    domain.#price = entity.price;
    domain.#createDate = entity.createDate;
    domain.#expireDate = entity.expireDate;
    domain.#updateDate = entity.updateDate;

    return domain;
  }

  toEntity() {
    const entity = new SeatEntity();

    entity.id = this.#id;
    entity.userId = this.#userId;
    entity.concertScheduleId = this.#concertScheduleId;
    entity.seatNumber = this.#seatNumber;
    entity.status = this.#status;
    entity.price = this.#price;
    entity.createDate = this.#createDate;
    entity.expireDate = this.#expireDate;

    return entity;
  }

  validateReservation() {
    if (this.isReserved() || this.isPaid())
      throw new CannotReserveError(
        `seat status is ${this.#status}. cannot reserve`,
      );
  }
  validatePaid({ userId, nowDate }: { userId: number; nowDate: Date }) {
    if (
      this.isEmpty() ||
      this.isPaid() ||
      this.isExpired({ nowDate }) ||
      this.#userId !== userId
    )
      throw new CannotReserveError(
        `seat status is ${this.#status}. cannot reserve`,
      );
  }

  isExpired({ nowDate }: { nowDate: Date }) {
    return this.#expireDate < nowDate;
  }

  reserve({ userId, nowDate }: { userId: number; nowDate: Date }) {
    this.#userId = userId;
    this.#status = 'RESERVED';
    this.#expireDate = dayjs(nowDate)
      .add(CONCERT_POLICY.EXPIRED_TIME_MIN, 'minute')
      .toDate();
  }

  paid() {
    this.#status = 'PAID';
    this.#expireDate = null;
  }

  isEmpty() {
    return this.#status === 'EMPTY';
  }

  isReserved() {
    return this.#status === 'RESERVED';
  }

  isPaid() {
    return this.#status === 'PAID';
  }

  toResponse() {
    return {
      userId: this.#userId,
      seatNumber: this.#seatNumber,
      status: this.#status,
      expiredDate: this.#expireDate,
      price: this.#price,
    };
  }
}
