import { BaseBusinessError } from './base-business-error';

export * from './base-business-error';
export * from './authentication-error';
export * from './internal-server-error';

export class NotFoundError extends BaseBusinessError {
  public constructor(message: string) {
    super({ errorCode: 'NOT_FOUND', message });
  }
}

export class TokenNotFound extends BaseBusinessError {
  public constructor(message: string) {
    super({ errorCode: 'TOKEN_NOT_FOUND', message });
  }
}

export class TokenExpired extends BaseBusinessError {
  public constructor(message: string) {
    super({ errorCode: 'TOKEN_EXPIRED', message });
  }
}

export class PointNotEnough extends BaseBusinessError {
  public constructor(message: string) {
    super({ errorCode: 'POINT_NOT_ENOUGH', message });
  }
}

export class CannotReserveError extends BaseBusinessError {
  public constructor(message: string) {
    super({ errorCode: 'CANNOT_RESERVE_ERROR', message });
  }
}

export class CannotPaidError extends BaseBusinessError {
  public constructor(message: string) {
    super({ errorCode: 'CANNOT_PAID_ERROR', message });
  }
}

export class LockAcquiredFailed extends BaseBusinessError {
  public constructor(message: string) {
    super({ errorCode: 'LOCK_ACQUIRED_FAILED', message });
  }
}
