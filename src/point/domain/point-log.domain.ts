import { PointLogEntity, Transaction } from '../../entity';

export class PointLogDomain {
  #id: number;
  #userId: number;
  #amount: number;
  #transaction: Transaction;
  #beforeAmount: number;
  #afterAmount: number;
  #createDate: Date;

  static fromEntity(entity: PointLogEntity) {
    const domain = new PointLogDomain();

    domain.#id = entity.id;
    domain.#userId = entity.userId;
    domain.#amount = entity.amount;
    domain.#transaction = entity.transaction;
    domain.#beforeAmount = entity.beforeAmount;
    domain.#afterAmount = entity.afterAmount;
    domain.#createDate = entity.createDate;

    return domain;
  }

  toEntity() {
    const entity = new PointLogEntity();

    entity.id = this.#id;
    entity.userId = this.#userId;
    entity.amount = this.#amount;
    entity.transaction = this.#transaction;
    entity.beforeAmount = this.#beforeAmount;
    entity.afterAmount = this.#afterAmount;

    return entity;
  }

  static createUseLog({
    userId,
    amount,
    beforeAmount,
    afterAmount,
  }: {
    userId: number;
    amount: number;
    beforeAmount: number;
    afterAmount: number;
  }) {
    const domain = new PointLogDomain();

    domain.#userId = userId;
    domain.#amount = amount;
    domain.#beforeAmount = beforeAmount;
    domain.#afterAmount = afterAmount;
    domain.#transaction = 'USE';

    return domain;
  }

  static createChargeLog({
    userId,
    amount,
    beforeAmount,
    afterAmount,
  }: {
    userId: number;
    amount: number;
    beforeAmount: number;
    afterAmount: number;
  }) {
    const domain = new PointLogDomain();

    domain.#userId = userId;
    domain.#amount = amount;
    domain.#beforeAmount = beforeAmount;
    domain.#afterAmount = afterAmount;
    domain.#transaction = 'CHARGE';

    return domain;
  }
}
