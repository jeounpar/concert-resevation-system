import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import {
  AuthenticationError,
  BaseBusinessError,
  InternalServerError,
} from '../error';
import { Request, Response } from 'express';
import { MyCustomLogger } from '../log/my-custom-logger';

@Catch(Error)
export class MyCustomExceptionFilter implements ExceptionFilter {
  private logger: MyCustomLogger;

  constructor(logger: MyCustomLogger) {
    this.logger = logger;
  }

  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = this.#defineStatusCode(error);
    const errorCode = this.#defineErrorCode(error);
    const metaData = this.#defineMetaData(error);
    const message = error.message ? error.message : '';

    response.status(statusCode).json({
      code: errorCode,
      message: message,
      path: request.url,
      method: request.method,
      metaData: metaData,
    });

    this.logger.error('Catch', error.message);
    if (error.stack) this.logger.error('Catch', error.stack);
  }

  #defineStatusCode(error: Error): number {
    if (
      error instanceof BaseBusinessError ||
      error instanceof AuthenticationError ||
      error instanceof InternalServerError
    )
      return error.statusCode;

    return 500;
  }

  #defineErrorCode(error: Error): string {
    if (
      error instanceof BaseBusinessError ||
      error instanceof AuthenticationError ||
      error instanceof InternalServerError
    )
      return error.errorCode;

    return 'UNEXPECTED_ERROR';
  }

  #defineMetaData(error: Error): object {
    if (
      error instanceof BaseBusinessError ||
      error instanceof AuthenticationError ||
      error instanceof InternalServerError
    )
      return error.metaData;
    return {};
  }
}
