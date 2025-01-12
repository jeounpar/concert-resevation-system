import { Injectable } from '@nestjs/common';
import { SeatRepository } from '../repository/seat.repository';
import { getDataSource } from '../../config/typeorm-factory';
import { NotFoundError } from '../../error';
import { EntityManager } from 'typeorm';
import { ConcertScheduleRepository } from '../repository/concert-schedule.repository';
import { AvailableSeatsResponseDTO } from '../controller/concert.dto';

@Injectable()
export class ConcertService {
  constructor(
    private readonly concertScheduleRepository: ConcertScheduleRepository,
    private readonly seatRepository: SeatRepository,
  ) {}

  async reserve({ seatId, userId }: { seatId: number; userId: number }) {
    const nowDate = new Date();

    return await getDataSource().transaction(async (mgr) => {
      const seat = await this.seatRepository
        .findOne(mgr)
        .idWithLock({ id: seatId });
      if (!seat) throw new NotFoundError('seat not found');

      seat.validateReservation();
      seat.reserve({ userId, nowDate });

      const saved = await this.seatRepository.save({ domain: seat, mgr });
      return saved.toResponse();
    });
  }

  async paid({
    seatId,
    userId,
    nowDate,
    mgr,
  }: {
    seatId: number;
    userId: number;
    nowDate: Date;
    mgr?: EntityManager;
  }) {
    const execute = async (transaction: EntityManager) => {
      const seat = await this.seatRepository
        .findOne(transaction)
        .idWithLock({ id: seatId });
      if (!seat) throw new NotFoundError('seat not found');

      seat.validatePaid({ userId, nowDate });
      seat.paid();

      const saved = await this.seatRepository.save({
        domain: seat,
        mgr: transaction,
      });
      return saved.toResponse();
    };

    return mgr
      ? await execute(mgr)
      : await getDataSource().transaction(execute);
  }

  async changeStatusToEmptyWithExpiredSeat({ nowDate }: { nowDate: Date }) {
    return await getDataSource().transaction(async (mgr) => {
      await this.seatRepository.changeStatusToEmptyWithExpiredSeat({
        nowDate,
        mgr,
      });
    });
  }

  // 예약 가능 날짜
  async getAvailableTimes({ concertId }: { concertId: number }) {
    const concertSchedules = await this.concertScheduleRepository
      .findMany()
      .concertId({ concertId });

    if (concertSchedules.length === 0) return [];

    return concertSchedules.map((e) => e.toResponse());
  }

  // 예약 가능 좌석
  async getAvailableSeats({
    concertId,
    theDateString,
  }: {
    concertId: number;
    theDateString: string;
  }): Promise<AvailableSeatsResponseDTO> {
    const concertSchedule = await this.concertScheduleRepository
      .findOne()
      .concertIdAndTheDate({ concertId, theDateString });
    if (!concertSchedule) throw new NotFoundError('concertSchedule not found');

    const seats = await this.seatRepository
      .findMany()
      .concertScheduleId({ concertScheduleId: concertSchedule.id });
    if (seats.length === 0)
      return {
        concertId,
        theDateString,
        seatInfo: [],
      };

    return {
      concertId,
      theDateString,
      seatInfo: seats.map((e) => e.toInfo()),
    };
  }
}
