import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenEntity, TokenStatus } from '../../entity';
import { EntityManager, Repository } from 'typeorm';
import { TokenDomain } from '../domain/token.domain';

@Injectable()
export class TokenRepository {
  constructor(
    @InjectRepository(TokenEntity)
    private readonly repository: Repository<TokenEntity>,
  ) {}

  #getRepo(mgr?: EntityManager) {
    return mgr ? mgr.getRepository(TokenEntity) : this.repository;
  }

  async save({ domain, mgr }: { domain: TokenDomain; mgr?: EntityManager }) {
    const repo = this.#getRepo(mgr);

    const saved = await repo.save(domain.toEntity());

    return TokenDomain.fromEntity(saved);
  }

  async bulkSave({
    domains,
    mgr,
  }: {
    domains: TokenDomain[];
    mgr?: EntityManager;
  }) {
    const repo = this.#getRepo(mgr);

    await repo.save(domains.map((e) => e.toEntity()));
  }

  async deleteExpired({
    nowDate,
    mgr,
  }: {
    nowDate: Date;
    mgr?: EntityManager;
  }) {
    const repo = this.#getRepo(mgr);

    await repo
      .createQueryBuilder()
      .softDelete()
      .where('expired_date < :nowDate', { nowDate })
      .execute();
  }

  findMany(mgr?: EntityManager) {
    const repo = this.#getRepo(mgr);

    return {
      async blockedWithTake({ take }: { take: number }) {
        const found = await repo.find({
          where: { status: 'BLOCK' },
          order: { id: 'ASC' },
          take,
        });

        return found.length !== 0 ? found.map(TokenDomain.fromEntity) : [];
      },
    };
  }

  count(mgr?: EntityManager) {
    const repo = this.#getRepo(mgr);

    return {
      async allow() {
        return await repo.count({ where: { status: 'ALLOW' } });
      },
    };
  }

  findOne(mgr?: EntityManager) {
    const repo = this.#getRepo(mgr);

    return {
      async latestAllowed() {
        const entity = await repo.findOne({
          where: { status: 'ALLOW' },
          order: { id: 'ASC' },
        });

        return entity ? TokenDomain.fromEntity(entity) : null;
      },
      async userId({ userId }: { userId: number }) {
        const entity = await repo.findOne({
          where: { userId },
        });

        return entity ? TokenDomain.fromEntity(entity) : null;
      },
      async userIdWithStatus({
        userId,
        status,
      }: {
        userId: number;
        status: TokenStatus;
      }) {
        const entity = await repo.findOne({
          where: { userId, status },
        });

        return entity ? TokenDomain.fromEntity(entity) : null;
      },
      async tokenId({ tokenId }: { tokenId: string }) {
        const entity = await repo.findOne({
          where: { tokenId },
        });

        return entity ? TokenDomain.fromEntity(entity) : null;
      },
      async tokenIdWithAllowStatus({
        tokenId,
        status,
      }: {
        tokenId: string;
        status: TokenStatus;
      }) {
        const entity = await repo.findOne({
          where: { tokenId, status },
        });

        return entity ? TokenDomain.fromEntity(entity) : null;
      },
    };
  }
}