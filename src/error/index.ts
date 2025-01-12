export class TokenNotFound extends Error {
  public constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

export class TokenExpired extends Error {
  public constructor(message: string) {
    super(message);
  }
}

export class PointNotEnough extends Error {
  public constructor(message: string) {
    super(message);
  }
}

export class CannotReserveError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

export class CannotPaidError extends Error {
  public constructor(message: string) {
    super(message);
  }
}
