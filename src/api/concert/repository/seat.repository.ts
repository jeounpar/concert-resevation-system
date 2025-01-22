import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SeatEntity, SeatStatus } from '../../../entity';
import { EntityManager, Repository } from 'typeorm';
import { SeatDomain } from '../domain/seat.domain';

@Injectable()
export class SeatRepository {
  constructor(
    @InjectRepository(SeatEntity)
    private readonly repository: Repository<SeatEntity>,
  ) {}

  #getRepo(mgr?: EntityManager) {
    return mgr ? mgr.getRepository(SeatEntity) : this.repository;
  }

  async save({ domain, mgr }: { domain: SeatDomain; mgr?: EntityManager }) {
    const repo = this.#getRepo(mgr);

    const saved = await repo.save(domain.toEntity());
    return SeatDomain.fromEntity(saved);
  }

  async saveWithVersion({
    domain,
    mgr,
  }: {
    domain: SeatDomain;
    mgr?: EntityManager;
  }) {
    const repo = this.#getRepo(mgr);

    const updateEntity = domain.toUpdate();
    const result = await repo.update(
      updateEntity.criteria,
      updateEntity.partialEntity,
    );
    if (result.affected === 0) {
      throw new Error('Optimistic lock conflict. Reservation failed.');
    }

    const found = await repo.findOne({
      where: { id: updateEntity.criteria.id },
    });
    return SeatDomain.fromEntity(found);
  }

  async changeStatusToEmptyWithExpiredSeat({
    nowDate,
    mgr,
  }: {
    nowDate: Date;
    mgr?: EntityManager;
  }) {
    const repo = this.#getRepo(mgr);

    await repo
      .createQueryBuilder()
      .update('SeatEntity')
      .set({ userId: null, expireDate: null, status: 'EMPTY' })
      .where('status = :status', { status: 'RESERVED' })
      .andWhere('expireDate < :nowDate', { nowDate })
      .execute();
  }

  findOne(mgr?: EntityManager) {
    const repo = this.#getRepo(mgr);

    return {
      async idWithPessimisticLock({ id }: { id: number }) {
        if (!mgr) throw new Error('EntityManager does not exist');

        const entity = await repo.findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        return entity ? SeatDomain.fromEntity(entity) : null;
      },
      async idWithStatus({ id, status }: { id: number; status: SeatStatus }) {
        if (!mgr) throw new Error('EntityManager does not exist');

        const entity = await repo.findOne({
          where: { id, status },
        });

        return entity ? SeatDomain.fromEntity(entity) : null;
      },
      async id({ id }: { id: number }) {
        if (!mgr) throw new Error('EntityManager does not exist');

        const entity = await repo.findOne({
          where: { id },
        });

        return entity ? SeatDomain.fromEntity(entity) : null;
      },
    };
  }

  findMany(mgr?: EntityManager) {
    const repo = this.#getRepo(mgr);

    return {
      async concertScheduleId({
        concertScheduleId,
      }: {
        concertScheduleId: number;
      }) {
        const entity = await repo.find({ where: { concertScheduleId } });

        return entity ? entity.map(SeatDomain.fromEntity) : [];
      },
    };
  }
}
