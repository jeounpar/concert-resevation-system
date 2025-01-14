import { Injectable } from '@nestjs/common';
import { AsyncLocalStorageService } from './async-local-storage.service';
import * as winston from 'winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class MyCustomLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(
    private readonly asyncLocalStorageService: AsyncLocalStorageService,
  ) {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}] ${message}`;
        }),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/app.log',
          level: 'info',
        }),
      ],
    });
  }

  #getRequestId(): string {
    return (
      this.asyncLocalStorageService.get<string>('requestId') ||
      'unknown-request'
    );
  }

  #formatMessage(
    methodName: string,
    message?: string,
    optionalParams?: any,
  ): string {
    return `requestId=[${this.#getRequestId()}], methodName=[${methodName}], message=[${message}], optionalParams=[${optionalParams ? JSON.stringify(optionalParams) : ''}]`;
  }

  log(methodName: string, message?: string, optionalParams?: any) {
    this.logger.info(this.#formatMessage(methodName, message, optionalParams));
  }

  error(methodName: string, message?: string, optionalParams?: any) {
    this.logger.error(this.#formatMessage(methodName, message, optionalParams));
  }

  warn(methodName: string, message?: string, optionalParams?: any) {
    this.logger.warn(this.#formatMessage(methodName, message, optionalParams));
  }

  debug(methodName: string, message?: string, optionalParams?: any) {
    this.logger.debug(this.#formatMessage(methodName, message, optionalParams));
  }

  verbose(methodName: string, message?: string, optionalParams?: any) {
    this.logger.verbose(
      this.#formatMessage(methodName, message, optionalParams),
    );
  }
}
