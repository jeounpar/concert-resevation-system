import { TokenEntity, TokenStatus } from '../../entity';
import { v4 as uuid } from 'uuid';
import * as dayjs from 'dayjs';
import { TOKEN_POLICY } from '../../policy';
import { TokenExpired } from '../../error';

export class TokenDomain {
  #id: number;
  #userId: number;
  #tokenValue: string;
  #issuedDate: Date;
  #expiredDate: Date;
  #status: TokenStatus;

  private constructor() {}

  static fromEntity(entity: TokenEntity): TokenDomain {
    const domain = new TokenDomain();

    domain.#id = entity.id;
    domain.#userId = entity.userId;
    domain.#status = entity.status;
    domain.#tokenValue = entity.tokenValue;
    domain.#issuedDate = entity.issuedDate;
    domain.#expiredDate = entity.expiredDate;

    return domain;
  }

  toEntity(): TokenEntity {
    const entity = new TokenEntity();

    entity.id = this.#id;
    entity.userId = this.#userId;
    entity.status = this.#status;
    entity.tokenValue = this.#tokenValue;
    entity.issuedDate = this.#issuedDate;
    entity.expiredDate = this.#expiredDate;

    return entity;
  }

  static createWaitStatus({
    userId,
    nowDate,
  }: {
    userId: number;
    nowDate: Date;
  }) {
    const domain = new TokenDomain();

    domain.#userId = userId;
    domain.#status = 'WAIT';
    domain.#tokenValue = uuid();
    domain.#issuedDate = nowDate;
    domain.#expiredDate = dayjs(nowDate)
      .add(TOKEN_POLICY.EXPIRED_TIME_SEC, 'seconds')
      .toDate();

    return domain;
  }

  setActive() {
    this.#status = 'ACTIVE';
  }

  setWait() {
    this.#status = 'WAIT';
  }

  isActive() {
    return this.#status === 'ACTIVE';
  }

  isWait() {
    return this.#status === 'WAIT';
  }

  isExpired({ nowDate }: { nowDate: Date }) {
    return this.#expiredDate < nowDate;
  }

  validateToken({ nowDate }: { nowDate: Date }) {
    if (this.isWait() || this.isExpired({ nowDate }))
      throw new TokenExpired(
        `token is expired at ${this.#expiredDate.toISOString()}`,
      );
  }

  id() {
    return this.#id;
  }

  tokenValue() {
    return this.#tokenValue;
  }

  info() {
    return {
      userId: this.#userId,
      tokenValue: this.#tokenValue,
      issuedDate: this.#issuedDate,
      expiredDate: this.#expiredDate,
      status: this.#status,
    };
  }
}
