import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PointLogEntity } from '../../../entity';
import { EntityManager, Repository } from 'typeorm';
import { PointLogDomain } from '../domain/point-log.domain';

@Injectable()
export class PointLogRepository {
  constructor(
    @InjectRepository(PointLogEntity)
    private readonly repository: Repository<PointLogEntity>,
  ) {}

  #getRepo(mgr?: EntityManager) {
    return mgr ? mgr.getRepository(PointLogEntity) : this.repository;
  }

  async save({ domain, mgr }: { domain: PointLogDomain; mgr?: EntityManager }) {
    const repo = this.#getRepo(mgr);

    const saved = await repo.save(domain.toEntity());

    return PointLogDomain.fromEntity(saved);
  }
}
