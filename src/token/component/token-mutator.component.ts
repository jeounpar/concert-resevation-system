import { Injectable } from '@nestjs/common';
import { TokenRepository } from '../repository/token.repository';
import { EntityManager } from 'typeorm';
import { TokenDomain } from '../domain/token.domain';

@Injectable()
export class TokenMutatorComponent {
  constructor(private readonly tokenRepository: TokenRepository) {}

  async issue({
    userId,
    nowDate,
    mgr,
  }: {
    userId: number;
    nowDate: Date;
    mgr?: EntityManager;
  }) {
    const blockedToken = TokenDomain.createBlockStatus({ userId, nowDate });

    const savedToken = await this.tokenRepository.save({
      domain: blockedToken,
      mgr,
    });

    return savedToken;
  }

  async allow({ domain, mgr }: { domain: TokenDomain; mgr?: EntityManager }) {
    domain.setAllow();
    const saved = await this.tokenRepository.save({ domain, mgr });

    return saved;
  }

  async block({ domain, mgr }: { domain: TokenDomain; mgr?: EntityManager }) {
    domain.setBlock();
    const saved = await this.tokenRepository.save({ domain, mgr });

    return saved;
  }

  async deleteExpiredToken({
    nowDate,
    mgr,
  }: {
    nowDate: Date;
    mgr?: EntityManager;
  }) {
    await this.tokenRepository.deleteExpired({ nowDate, mgr });
  }

  async allowTokens({
    domains,
    mgr,
  }: {
    domains: TokenDomain[];
    mgr?: EntityManager;
  }) {
    domains.forEach((e) => e.setAllow());
    await this.tokenRepository.bulkSave({ domains, mgr });
  }
}
