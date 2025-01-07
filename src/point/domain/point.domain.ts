import { PointEntity } from '../../entity';
import { PointNotEnough } from '../../error';
import { PointLogDomain } from './point-log.domain';

export class PointDomain {
  #id: number;
  #userId: number;
  #remainPoint: number;
  #createDate: Date;
  #updateDate: Date | null;
  #logs: PointLogDomain[];

  private constructor() {}

  static fromEntity(entity: PointEntity) {
    const domain = new PointDomain();

    domain.#id = entity.id;
    domain.#userId = entity.userId;
    domain.#remainPoint = entity.remainPoint;
    domain.#createDate = entity.createDate;
    domain.#updateDate = entity.updateDate;
    domain.#logs = entity.logs
      ? entity.logs.map(PointLogDomain.fromEntity)
      : [];

    return domain;
  }

  toEntity() {
    const entity = new PointEntity();

    entity.id = this.#id;
    entity.userId = this.#userId;
    entity.remainPoint = this.#remainPoint;

    return entity;
  }

  static init({ userId }: { userId: number }) {
    const domain = new PointDomain();

    domain.#userId = userId;
    domain.#remainPoint = 0;

    return domain;
  }

  use({ amount }: { amount: number }) {
    if (this.#remainPoint - amount < 0)
      throw new PointNotEnough('point not enough to use');

    const beforeAmount = this.#remainPoint;
    this.#remainPoint -= amount;
    const afterAmount = this.#remainPoint;

    return PointLogDomain.createUseLog({
      userId: this.#userId,
      amount,
      beforeAmount,
      afterAmount,
    });
  }

  charge({ amount }: { amount: number }) {
    const beforeAmount = this.#remainPoint;
    this.#remainPoint += amount;
    const afterAmount = this.#remainPoint;

    return PointLogDomain.createChargeLog({
      userId: this.#userId,
      amount,
      beforeAmount,
      afterAmount,
    });
  }

  toResponse() {
    return {
      userId: this.#userId,
      remainPoint: this.#remainPoint,
    };
  }
}
