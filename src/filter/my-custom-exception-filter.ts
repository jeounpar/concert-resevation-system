import {
  ArgumentsHost,
  Catch,
  ConsoleLogger,
  ExceptionFilter,
} from '@nestjs/common';
import {
  AuthenticationError,
  BaseBusinessError,
  InternalServerError,
} from '../error';
import { Request, Response } from 'express';

@Catch(Error)
export class MyCustomExceptionFilter implements ExceptionFilter {
  private _logger: ConsoleLogger;

  constructor(logger: ConsoleLogger) {
    this._logger = logger;
  }

  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = this._defineStatusCode(error);
    const errorCode = this._defineErrorCode(error);
    const metaData = this._defineMetaData(error);
    const message = error.message ? error.message : '';

    response.status(statusCode).json({
      code: errorCode,
      message: message,
      path: request.url,
      method: request.method,
      metaData: metaData,
    });

    if (error.stack) this._logger.debug(error.stack);
  }

  private _defineStatusCode(error: Error): number {
    if (
      error instanceof BaseBusinessError ||
      error instanceof AuthenticationError ||
      error instanceof InternalServerError
    )
      return error.statusCode;

    return 500;
  }

  private _defineErrorCode(error: Error): string {
    if (
      error instanceof BaseBusinessError ||
      error instanceof AuthenticationError ||
      error instanceof InternalServerError
    )
      return error.errorCode;

    return 'UNEXPECTED_ERROR';
  }

  private _defineMetaData(error: Error): object {
    if (
      error instanceof BaseBusinessError ||
      error instanceof AuthenticationError ||
      error instanceof InternalServerError
    )
      return error.metaData;
    return {};
  }
}
