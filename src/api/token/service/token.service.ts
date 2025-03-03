import { Injectable } from '@nestjs/common';
import { getDataSource } from '../../../config/typeorm-factory';
import { TokenRepository } from '../repository/token.repository';
import { TokenDomain } from '../domain/token.domain';
import { EntityManager } from 'typeorm';
import { NotFoundError, TokenNotFound } from '../../../error';
import { MyCustomLogger } from '../../../log/my-custom-logger';
import { RedisTokenQueue } from '../../../redis';

@Injectable()
export class TokenService {
  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly redisTokenQueue: RedisTokenQueue,
    private readonly logger: MyCustomLogger,
  ) {}

  async getCurrentOrder({ tokenValue }: { tokenValue: string }) {
    const token = await this.tokenRepository
      .findOne()
      .tokenValue({ tokenValue });
    if (!token) throw new NotFoundError(`token=${tokenValue} not found`);

    return await this.redisTokenQueue.rank({ userId: token.userId });
  }

  async issue({ userId }: { userId: number }) {
    return await getDataSource().transaction(async (mgr) => {
      const nowDate = new Date();

      const existToken = await this.tokenRepository
        .findOne(mgr)
        .userId({ userId });
      if (existToken) return existToken.info();

      const newToken = TokenDomain.createWaitStatus({ userId, nowDate });
      await this.tokenRepository.insert({
        domain: newToken,
        mgr,
      });

      await this.redisTokenQueue.add({ userId, nowDate });

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
    await this.redisTokenQueue.removeActiveTokenByUserId({ userId });
  }

  async deleteExpiredToken({
    nowDate,
    mgr,
  }: {
    nowDate: Date;
    mgr?: EntityManager;
  }) {
    await this.tokenRepository.deleteExpired({ nowDate, mgr });
    await this.redisTokenQueue.removeExpiredActiveTokens({ nowDate });
  }

  async activeToken({ mgr }: { mgr?: EntityManager }) {
    mgr;
    const redisUserTokens = await this.redisTokenQueue.pop();
    await this.redisTokenQueue.active(redisUserTokens);
  }

  async validateToken({
    tokenValue,
    nowDate,
  }: {
    tokenValue: string;
    nowDate: Date;
  }) {
    nowDate;
    const token = await this.tokenRepository
      .findOne()
      .tokenValue({ tokenValue });
    if (!token)
      throw new TokenNotFound(
        `token with tokenValue=${tokenValue} is not found`,
      );

    await this.redisTokenQueue.validateToken({ userId: token.userId });
  }
}
