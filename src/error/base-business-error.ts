export class BaseBusinessError extends Error {
  errorCode: string;
  message: string;
  metaData?: object;
  statusCode = 400;

  constructor({
    errorCode,
    message,
    metaData,
  }: {
    errorCode: string;
    message: string;
    subCode?: string;
    metaData?: object;
  }) {
    super(`${errorCode}:${message}`);
    this.errorCode = errorCode;
    this.message = message;
    this.metaData = metaData;
  }
}
