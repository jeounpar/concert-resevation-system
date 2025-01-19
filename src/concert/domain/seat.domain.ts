import { SeatEntity, SeatStatus } from '../../entity';
import { CannotPaidError, CannotReserveError } from '../../error';
import * as dayjs from 'dayjs';
import { CONCERT_POLICY } from '../../policy';

export interface SeatResponse {
  userId: number;
  seatNumber: number;
  status: SeatStatus;
  expiredDate: Date;
  price: number;
}

export interface SeatInfo {
  seatId: number;
  seatNumber: number;
  status: SeatStatus;
  price: number;
}

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
  #version: number;

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
    domain.#version = entity.version;

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
    entity.version = this.#version;

    return entity;
  }

  toUpdate() {
    return {
      criteria: {
        id: this.#id,
        version: this.#version,
      },
      partialEntity: {
        concertScheduleId: this.#concertScheduleId,
        userId: this.#userId,
        seatNumber: this.#seatNumber,
        status: this.#status,
        price: this.#price,
      },
    };
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
      throw new CannotPaidError('cannot paid');
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

  toResponse(): SeatResponse {
    return {
      userId: this.#userId,
      seatNumber: this.#seatNumber,
      status: this.#status,
      expiredDate: this.#expireDate,
      price: this.#price,
    };
  }

  toInfo(): SeatInfo {
    return {
      seatId: this.#id,
      seatNumber: this.#seatNumber,
      status: this.#status,
      price: this.#price,
    };
  }
}
