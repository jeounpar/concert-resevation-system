import { Injectable } from '@nestjs/common';
import { SeatRepository } from '../repository/seat.repository';
import { getDataSource } from '../../config/typeorm-factory';
import { NotFoundError } from '../../error';
import { EntityManager } from 'typeorm';
import { ConcertScheduleRepository } from '../repository/concert-schedule.repository';
import { AvailableSeatsResponseDTO } from '../controller/concert.dto';
import { MyCustomLogger } from '../../log/my-custom-logger';

@Injectable()
export class ConcertService {
  constructor(
    private readonly concertScheduleRepository: ConcertScheduleRepository,
    private readonly seatRepository: SeatRepository,
    private readonly logger: MyCustomLogger,
  ) {}

  async reserve({ seatId, userId }: { seatId: number; userId: number }) {
    const nowDate = new Date();
    this.logger.log('reserve', 'reserve start', { nowDate });

    return await getDataSource().transaction(async (mgr) => {
      const seat = await this.seatRepository
        .findOne(mgr)
        .idWithPessimisticLock({ id: seatId });
      if (!seat) throw new NotFoundError('seat not found');
      this.logger.log('reserve', 'seat info', seat.toInfo());

      seat.validateReservation();
      seat.reserve({ userId, nowDate });

      this.logger.log('reserve', 'after seat reserved', seat.toInfo());

      const saved = await this.seatRepository.save({ domain: seat, mgr });

      this.logger.log('reserve', 'saved seat info', seat.toInfo());
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
        .idWithPessimisticLock({ id: seatId });
      if (!seat) throw new NotFoundError('seat not found');
      this.logger.log('paid', 'seat info', seat.toInfo());

      seat.validatePaid({ userId, nowDate });
      seat.paid();
      this.logger.log('reserve', 'after seat paid', seat.toInfo());

      const saved = await this.seatRepository.save({
        domain: seat,
        mgr: transaction,
      });

      this.logger.log('reserve', 'saved seat info', seat.toInfo());
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
