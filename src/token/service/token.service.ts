import { Injectable } from '@nestjs/common';
import { getDataSource } from '../../config/typeorm-factory';
import { TokenRepository } from '../repository/token.repository';
import { TokenDomain } from '../domain/token.domain';
import { EntityManager } from 'typeorm';
import { TOKEN_POLICY } from '../../policy';
import { NotFoundError, TokenNotFound } from '../../error';

@Injectable()
export class TokenService {
  constructor(private readonly tokenRepository: TokenRepository) {}

  async getCurrentOrder({ tokenValue }: { tokenValue: string }) {
    const myToken = await this.tokenRepository
      .findOne()
      .tokenValue({ tokenValue });
    const latestToken = await this.tokenRepository.findOne().latestActiveed();

    if (!myToken)
      throw new TokenNotFound(`token with tokenValue=${tokenValue} not found`);

    if (!latestToken) return 0;

    const order = myToken.id() - latestToken.id();

    return order > 0 ? order : 0;
  }

  async issue({ userId }: { userId: number }) {
    return await getDataSource().transaction(async (mgr) => {
      const nowDate = new Date();

      const existToken = await this.tokenRepository
        .findOne(mgr)
        .userId({ userId });
      if (existToken) return existToken.info();

      const newToken = await this.tokenRepository.save({
        domain: TokenDomain.createWaitStatus({ userId, nowDate }),
        mgr,
      });

      return newToken.info();
    });
  }

  async allow({ tokenValue }: { tokenValue: string }) {
    return await getDataSource().transaction(async (mgr) => {
      const token = await this.tokenRepository
        .findOne(mgr)
        .tokenValue({ tokenValue });
      if (!token)
        throw new NotFoundError(
          `token with tokenValue=${tokenValue} not found`,
        );

      token.setActive();
      await this.tokenRepository.save({ domain: token, mgr });

      return token.info();
    });
  }

  async wait({ tokenValue }: { tokenValue: string }) {
    return await getDataSource().transaction(async (mgr) => {
      const token = await this.tokenRepository
        .findOne(mgr)
        .tokenValue({ tokenValue });
      if (!token)
        throw new NotFoundError(
          `token with tokenValue=${tokenValue} not found`,
        );

      token.setWait();
      await this.tokenRepository.save({ domain: token, mgr });
      return token.info();
    });
  }

  async deleteTokenByUserId({
    userId,
    mgr,
  }: {
    userId: number;
    mgr?: EntityManager;
  }) {
    await this.tokenRepository.deleteByUserId({ userId, mgr });
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

  async activeToken({ mgr }: { mgr?: EntityManager }) {
    const allowedTokenCount = await this.tokenRepository.count(mgr).allow();
    const toBeActiveedTokenCount =
      TOKEN_POLICY.MAX_ACTIVE_TOKEN_COUNT - allowedTokenCount;
    if (toBeActiveedTokenCount <= 0) return;

    const blockedTokens = await this.tokenRepository
      .findMany(mgr)
      .blockedWithTake({ take: toBeActiveedTokenCount });
    blockedTokens.forEach((e) => e.setActive());
    await this.tokenRepository.bulkSave({ domains: blockedTokens, mgr });
  }

  async validateToken({
    tokenValue,
    nowDate,
  }: {
    tokenValue: string;
    nowDate: Date;
  }) {
    const token = await this.tokenRepository
      .findOne()
      .tokenValue({ tokenValue });
    if (!token)
      throw new TokenNotFound(
        `token with tokenValue=${tokenValue} is not found`,
      );
    token.validateToken({ nowDate });
  }
}
