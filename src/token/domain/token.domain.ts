import { TokenEntity, TokenStatus } from '../../entity';
import { v4 as uuid } from 'uuid';
import * as dayjs from 'dayjs';
import { TOKEN_POLICY } from '../../policy';
import { TokenExpired } from '../../error';

export class TokenDomain {
  #id: number;
  #userId: number;
  #tokenId: string;
  #issuedDate: Date;
  #expiredDate: Date;
  #status: TokenStatus;

  private constructor() {}

  static fromEntity(entity: TokenEntity): TokenDomain {
    const domain = new TokenDomain();

    domain.#id = entity.id;
    domain.#userId = entity.userId;
    domain.#status = entity.status;
    domain.#tokenId = entity.tokenId;
    domain.#issuedDate = entity.issuedDate;
    domain.#expiredDate = entity.expiredDate;

    return domain;
  }

  toEntity(): TokenEntity {
    const entity = new TokenEntity();

    entity.id = this.#id;
    entity.userId = this.#userId;
    entity.status = this.#status;
    entity.tokenId = this.#tokenId;
    entity.issuedDate = this.#issuedDate;
    entity.expiredDate = this.#expiredDate;

    return entity;
  }

  static createBlockStatus({
    userId,
    nowDate,
  }: {
    userId: number;
    nowDate: Date;
  }) {
    const domain = new TokenDomain();

    domain.#userId = userId;
    domain.#status = 'BLOCK';
    domain.#tokenId = uuid();
    domain.#issuedDate = nowDate;
    domain.#expiredDate = dayjs(nowDate)
      .add(TOKEN_POLICY.EXPIRED_TIME_SEC, 'seconds')
      .toDate();

    return domain;
  }

  setAllow() {
    this.#status = 'ALLOW';
  }

  setBlock() {
    this.#status = 'BLOCK';
  }

  isAllowed() {
    return this.#status === 'ALLOW';
  }

  isBlocked() {
    return this.#status === 'BLOCK';
  }

  isExpired({ nowDate }: { nowDate: Date }) {
    return this.#expiredDate < nowDate;
  }

  validateToken({ nowDate }: { nowDate: Date }) {
    if (this.isBlocked() || this.isExpired({ nowDate }))
      throw new TokenExpired(
        `token is expired at ${this.#expiredDate.toISOString()}`,
      );
  }

  id() {
    return this.#id;
  }

  info() {
    return {
      userId: this.#userId,
      tokenId: this.#tokenId,
      issuedDate: this.#issuedDate,
      expiredDate: this.#expiredDate,
      status: this.#status,
    };
  }
}
