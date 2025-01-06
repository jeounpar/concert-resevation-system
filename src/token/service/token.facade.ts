import { Injectable } from '@nestjs/common';
import { TokenMutatorComponent } from '../component/token-mutator.component';
import { TokenReaderComponent } from '../component/token-reader.component';
import { getDataSource } from '../../config/typeorm-factory';
import { UserReaderComponent } from '../../user/user-reader.component';
import { NotFoundError, TokenNotFound } from '../../error';

@Injectable()
export class TokenFacade {
  constructor(
    private readonly userReader: UserReaderComponent,
    private readonly tokenMutator: TokenMutatorComponent,
    private readonly tokenReader: TokenReaderComponent,
  ) {}

  async getCurrentOrder({ tokenId }: { tokenId: string }) {
    const myToken = await this.tokenReader.getByToken({ tokenId });
    const latestToken = await this.tokenReader.getLatestAllowedToken({});

    if (!myToken)
      throw new TokenNotFound(`token with tokenId=${tokenId} not found`);

    if (!latestToken) return 0;

    const order = myToken.id() - latestToken.id();

    return order > 0 ? order : 0;
  }

  async issue({ userId }: { userId: number }) {
    const user = await this.userReader.getByUserId({ userId });
    if (!user) throw new NotFoundError(`user with userId=${userId} not found`);

    return await getDataSource().transaction(async (mgr) => {
      const nowDate = new Date();

      const existToken = await this.tokenReader.getByUserId({
        userId,
        mgr,
      });
      if (existToken) return existToken.info();

      const newToken = await this.tokenMutator.issue({ userId, nowDate, mgr });
      return newToken.info();
    });
  }

  async allow({ tokenId }: { tokenId: string }) {
    return await getDataSource().transaction(async (mgr) => {
      const token = await this.tokenReader.getByToken({
        tokenId,
        mgr,
      });
      if (!token)
        throw new NotFoundError(`token with tokenId=${tokenId} not found`);

      const allowedToken = await this.tokenMutator.allow({
        domain: token,
        mgr,
      });
      return allowedToken.info();
    });
  }

  async block({ tokenId }: { tokenId: string }) {
    return await getDataSource().transaction(async (mgr) => {
      const token = await this.tokenReader.getByToken({
        tokenId,
        mgr,
      });
      if (!token)
        throw new NotFoundError(`token with tokenId=${tokenId} not found`);

      const blockedToken = await this.tokenMutator.block({
        domain: token,
        mgr,
      });
      return blockedToken.info();
    });
  }
}
