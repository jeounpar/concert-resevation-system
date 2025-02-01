import { Injectable } from '@nestjs/common';
import { SeatRepository } from '../repository/seat.repository';
import { getDataSource } from '../../../config/typeorm-factory';
import { CannotReserveError, NotFoundError } from '../../../error';
import { EntityManager } from 'typeorm';
import { ConcertScheduleRepository } from '../repository/concert-schedule.repository';
import {
  AvailableSeatsResponseDTO,
  AvailableTimesResponseDTO,
} from '../controller/concert.dto';
import { MyCustomLogger } from '../../../log/my-custom-logger';
import {
  getCacheKey,
  RedisCache,
  RedisSpinLock,
  SpinLockWithTransaction,
} from '../../../redis';
import { isNil } from '@nestjs/common/utils/shared.utils';

@Injectable()
export class ConcertService {
  constructor(
    private readonly redisSpinLock: RedisSpinLock,
    private readonly concertScheduleRepository: ConcertScheduleRepository,
    private readonly seatRepository: SeatRepository,
    private readonly redisCache: RedisCache,
    private readonly logger: MyCustomLogger,
  ) {}

  async reserveWithPessimisticLock({
    seatId,
    userId,
  }: {
    seatId: number;
    userId: number;
  }) {
    const nowDate = new Date();

    return await getDataSource().transaction(async (mgr) => {
      const seat = await this.seatRepository
        .findOne(mgr)
        .idWithPessimisticLock({ id: seatId });
      if (!seat) throw new NotFoundError('seat not found');

      seat.validateReservation();
      seat.reserve({ userId, nowDate });

      const saved = await this.seatRepository.save({ domain: seat, mgr });

      return saved.toResponse();
    });
  }

  async reserveWithOptimisticLock({
    seatId,
    userId,
  }: {
    seatId: number;
    userId: number;
  }) {
    const nowDate = new Date();

    return await getDataSource().transaction(async (mgr) => {
      const seat = await this.seatRepository
        .findOne(mgr)
        .idWithStatus({ id: seatId, status: 'EMPTY' });
      if (!seat) throw new NotFoundError('Seat not found');

      seat.validateReservation();
      seat.reserve({ userId, nowDate });

      try {
        const saved = await this.seatRepository.saveWithVersion({
          domain: seat,
          mgr,
        });
        return saved.toResponse();
      } catch (err) {
        throw new CannotReserveError('cannot reservation.');
      }
    });
  }

  @SpinLockWithTransaction('reserve-seat', 5000, 5, 200)
  async reserveWithRedisLock(
    {
      seatId,
      userId,
    }: {
      seatId: number;
      userId: number;
    },
    mgr?: EntityManager,
  ) {
    const nowDate = new Date();

    const seat = await this.seatRepository.findOne(mgr).id({ id: seatId });
    if (!seat) throw new NotFoundError('Seat not found');

    seat.validateReservation();
    seat.reserve({ userId, nowDate });

    const saved = await this.seatRepository.save({ domain: seat, mgr });
    return saved.toResponse();
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
    const cachedData = await this.redisCache.get<AvailableTimesResponseDTO>(
      getCacheKey('AVAILABLE_TIMES', concertId),
    );
    if (!isNil(cachedData)) return cachedData;

    const concertSchedules = await this.concertScheduleRepository
      .findMany()
      .concertId({ concertId });

    if (concertSchedules.length === 0) return [];

    const result = concertSchedules.map((e) => e.toResponse());
    await this.redisCache.set(
      getCacheKey('AVAILABLE_TIMES', concertId),
      result,
    );
    return result;
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
