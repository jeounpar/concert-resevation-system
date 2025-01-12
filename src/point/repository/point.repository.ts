import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PointEntity } from '../../entity';
import { EntityManager, Repository } from 'typeorm';
import { PointDomain } from '../domain/point.domain';

@Injectable()
export class PointRepository {
  constructor(
    @InjectRepository(PointEntity)
    private readonly repository: Repository<PointEntity>,
  ) {}

  #getRepo(mgr?: EntityManager) {
    return mgr ? mgr.getRepository(PointEntity) : this.repository;
  }

  async save({ domain, mgr }: { domain: PointDomain; mgr?: EntityManager }) {
    const repo = this.#getRepo(mgr);

    const saved = await repo.save(domain.toEntity());

    return PointDomain.fromEntity(saved);
  }

  findOne(mgr?: EntityManager) {
    const repo = this.#getRepo(mgr);

    return {
      async userIdWithLock({ userId }: { userId: number }) {
        if (!mgr) throw new Error('EntityManager does not exist');

        const entity = await repo.findOne({
          where: { userId },
          lock: { mode: 'pessimistic_write' },
        });

        return entity ? PointDomain.fromEntity(entity) : null;
      },
      async userId({ userId }: { userId: number }) {
        const entity = await repo.findOne({
          where: { userId },
        });

        return entity ? PointDomain.fromEntity(entity) : null;
      },
    };
  }
}
