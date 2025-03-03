import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OutboxEntity } from '../entity';
import { OutboxDomain } from './outbox.domain';

@Injectable()
export class OutboxRepository {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly repository: Repository<OutboxEntity>,
  ) {}

  #getRepo(mgr?: EntityManager) {
    return mgr ? mgr.getRepository(OutboxEntity) : this.repository;
  }

  async save({ domain, mgr }: { domain: OutboxDomain; mgr?: EntityManager }) {
    const repo = this.#getRepo(mgr);

    const saved = await repo.save(domain.toEntity());

    return OutboxDomain.fromEntity(saved);
  }

  async bulkSave({
    domains,
    mgr,
  }: {
    domains: OutboxDomain[];
    mgr?: EntityManager;
  }) {
    const repo = this.#getRepo(mgr);

    const saved = await repo.save(domains.map((e) => e.toEntity()));

    return saved.map((e) => OutboxDomain.fromEntity(e));
  }

  findMany(mgr?: EntityManager) {
    const repo = this.#getRepo(mgr);

    return {
      async initStatus(): Promise<OutboxDomain[]> {
        const entites = await repo.find({
          where: { status: 'INIT' },
        });

        return entites ? entites.map(OutboxDomain.fromEntity) : [];
      },
    };
  }

  findOne(mgr?: EntityManager) {
    const repo = this.#getRepo(mgr);

    return {
      async eventIdWithInitStatus(
        eventId: string,
      ): Promise<OutboxDomain | null> {
        const entity = await repo.findOne({
          where: { eventId, status: 'INIT' },
        });

        return entity ? OutboxDomain.fromEntity(entity) : null;
      },
    };
  }
}
