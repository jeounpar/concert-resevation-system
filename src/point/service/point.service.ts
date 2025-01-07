import { Injectable } from '@nestjs/common';
import { PointRepository } from '../repository/point.repository';
import { PointLogRepository } from '../repository/point-log.repository';
import { getDataSource } from '../../config/typeorm-factory';
import { PointDomain } from '../domain/point.domain';
import { NotFoundError } from '../../error';

@Injectable()
export class PointService {
  constructor(
    private readonly pointRepository: PointRepository,
    private readonly pointLogRepository: PointLogRepository,
  ) {}

  async getByUserId({ userId }: { userId: number }) {
    const point = await this.pointRepository.findOne().userId({ userId });
    if (!point)
      return {
        userId,
        remainPoint: 0,
      };

    return point.toResponse();
  }

  async charge({ userId, amount }: { userId: number; amount: number }) {
    return await getDataSource().transaction(async (mgr) => {
      const point = await this.pointRepository
        .findOne(mgr)
        .userIdWithLock({ userId });

      if (!point) {
        const initPoint = PointDomain.init({ userId });
        const pointLog = initPoint.charge({ amount });
        const savedPoint = await this.pointRepository.save({
          domain: initPoint,
          mgr,
        });
        await this.pointLogRepository.save({ domain: pointLog, mgr });
        return savedPoint.toResponse();
      }

      const pointLog = point.charge({ amount });
      const savedPoint = await this.pointRepository.save({
        domain: point,
        mgr,
      });
      await this.pointLogRepository.save({ domain: pointLog, mgr });
      return savedPoint.toResponse();
    });
  }

  async use({ userId, amount }: { userId: number; amount: number }) {
    return await getDataSource().transaction(async (mgr) => {
      const point = await this.pointRepository
        .findOne(mgr)
        .userIdWithLock({ userId });

      if (!point) throw new NotFoundError(`userId=${userId} point not found`);

      const pointLog = point.use({ amount });
      const savedPoint = await this.pointRepository.save({
        domain: point,
        mgr,
      });
      await this.pointLogRepository.save({ domain: pointLog, mgr });
      return savedPoint.toResponse();
    });
  }
}
