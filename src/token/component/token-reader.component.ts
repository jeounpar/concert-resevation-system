import { Injectable } from '@nestjs/common';
import { TokenRepository } from '../repository/token.repository';
import { EntityManager } from 'typeorm';
import { TokenStatus } from '../../entity';

@Injectable()
export class TokenReaderComponent {
  constructor(private readonly tokenRepository: TokenRepository) {}

  async getAllowedTokenCount({ mgr }: { mgr?: EntityManager }) {
    return await this.tokenRepository.count(mgr).allow();
  }

  async getBlockedTokenWithLimit({
    limit,
    mgr,
  }: {
    limit: number;
    mgr?: EntityManager;
  }) {
    const domains = await this.tokenRepository
      .findMany(mgr)
      .blockedWithTake({ take: limit });

    return domains;
  }

  async getByUserId({ userId, mgr }: { userId: number; mgr?: EntityManager }) {
    const domain = await this.tokenRepository.findOne(mgr).userId({ userId });

    return domain;
  }

  async getByUserIdWithStatus({
    userId,
    status,
    mgr,
  }: {
    userId: number;
    status: TokenStatus;
    mgr?: EntityManager;
  }) {
    const domain = await this.tokenRepository
      .findOne(mgr)
      .userIdWithStatus({ userId, status });

    return domain;
  }

  async getLatestAllowedToken({ mgr }: { mgr?: EntityManager }) {
    const domain = await this.tokenRepository.findOne(mgr).latestAllowed();

    return domain;
  }

  async getByToken({ tokenId, mgr }: { tokenId: string; mgr?: EntityManager }) {
    const domain = await this.tokenRepository.findOne(mgr).tokenId({ tokenId });

    return domain;
  }

  async validateToken({
    tokenId,
    mgr,
  }: {
    tokenId: string;
    status: TokenStatus;
    mgr?: EntityManager;
  }) {
    const domain = await this.tokenRepository.findOne(mgr).tokenId({ tokenId });

    return domain;
  }
}
