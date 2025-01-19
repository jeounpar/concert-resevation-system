export class AuthenticationError extends Error {
  errorCode: string;
  message: string;
  metaData?: object;
  statusCode = 401;

  constructor({
    errorCode,
    message,
    metaData,
  }: {
    errorCode: string;
    message: string;
    metaData?: object;
  }) {
    super(`${errorCode}:${message}`);
    this.errorCode = errorCode;
    this.message = message;
    this.metaData = metaData;
  }
}
