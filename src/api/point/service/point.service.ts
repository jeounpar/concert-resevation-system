import { Injectable } from '@nestjs/common';
import { PointRepository } from '../repository/point.repository';
import { PointLogRepository } from '../repository/point-log.repository';
import { getDataSource } from '../../../config/typeorm-factory';
import { PointDomain, PointResponse } from '../domain/point.domain';
import { NotFoundError } from '../../../error';
import { EntityManager } from 'typeorm';
import { MyCustomLogger } from '../../../log/my-custom-logger';

@Injectable()
export class PointService {
  constructor(
    private readonly pointRepository: PointRepository,
    private readonly pointLogRepository: PointLogRepository,
    private readonly logger: MyCustomLogger,
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

  async getByUserIdWithLock({
    userId,
    mgr,
  }: {
    userId: number;
    mgr: EntityManager;
  }) {
    const point = await this.pointRepository
      .findOne(mgr)
      .userIdWithLock({ userId });
    if (!point)
      return {
        userId,
        remainPoint: 0,
      };

    return point.toResponse();
  }

  async charge({ userId, amount }: { userId: number; amount: number }) {
    this.logger.log('charge', 'point charge start', { userId, amount });

    return await getDataSource().transaction(async (mgr) => {
      const point = await this.pointRepository
        .findOne(mgr)
        .userIdWithLock({ userId });

      if (!point) {
        this.logger.log('charge', 'user has no point data');

        const initPoint = PointDomain.init({ userId });
        const pointLog = initPoint.charge({ amount });
        const savedPoint = await this.pointRepository.save({
          domain: initPoint,
          mgr,
        });
        await this.pointLogRepository.save({ domain: pointLog, mgr });

        this.logger.log(
          'charge',
          'after charge point',
          savedPoint.toResponse(),
        );
        return savedPoint.toResponse();
      }

      this.logger.log('charge', 'user has point data', point.toResponse());

      const pointLog = point.charge({ amount });
      const savedPoint = await this.pointRepository.save({
        domain: point,
        mgr,
      });
      await this.pointLogRepository.save({ domain: pointLog, mgr });

      this.logger.log('charge', 'after charge point', savedPoint.toResponse());
      return savedPoint.toResponse();
    });
  }

  async use({
    userId,
    amount,
    mgr,
  }: {
    userId: number;
    amount: number;
    mgr?: EntityManager;
  }): Promise<PointResponse> {
    const execute = async (transaction: EntityManager) => {
      const point = await this.pointRepository
        .findOne(transaction)
        .userIdWithLock({ userId });
      if (!point) throw new NotFoundError(`userId=${userId} point not found`);

      this.logger.log('use', 'user point data', point.toResponse());

      const pointLog = point.use({ amount });
      const savedPoint = await this.pointRepository.save({
        domain: point,
        mgr: transaction,
      });
      this.logger.log('use', 'after use point', savedPoint.toResponse());

      await this.pointLogRepository.save({
        domain: pointLog,
        mgr: transaction,
      });

      return savedPoint.toResponse();
    };

    return mgr
      ? await execute(mgr)
      : await getDataSource().transaction(execute);
  }
}
