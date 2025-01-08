import { Injectable } from '@nestjs/common';
import { SeatRepository } from '../repository/seat.repository';
import { getDataSource } from '../../config/typeorm-factory';
import { NotFoundError } from '../../error';

@Injectable()
export class ConcertService {
  constructor(private readonly seatRepository: SeatRepository) {}

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
  }: {
    seatId: number;
    userId: number;
    nowDate: Date;
  }) {
    return await getDataSource().transaction(async (mgr) => {
      const seat = await this.seatRepository
        .findOne(mgr)
        .idWithLock({ id: seatId });
      if (!seat) throw new NotFoundError('seat not found');

      seat.validatePaid({ userId, nowDate });
      seat.paid();

      const saved = await this.seatRepository.save({ domain: seat, mgr });
      return saved.toResponse();
    });
  }

  async changeStatusToEmptyWithExpiredSeat({ nowDate }: { nowDate: Date }) {
    return await getDataSource().transaction(async (mgr) => {
      await this.seatRepository.changeStatusToEmptyWithExpiredSeat({
        nowDate,
        mgr,
      });
    });
  }
}
