import { ConsoleLogger, Injectable } from '@nestjs/common';
import { AsyncLocalStorageService } from './async-local-storage.service';

@Injectable()
export class MyCustomLogger extends ConsoleLogger {
  constructor(
    context: string,
    private readonly asyncLocalStorageService: AsyncLocalStorageService,
  ) {
    super(context);
  }

  #getRequestId(): string {
    return (
      this.asyncLocalStorageService.get<string>('requestId') ||
      'unknown-request'
    );
  }

  log(methodName: string, message?: string, optionalParams?: any) {
    super.log(
      `requestId=[${this.#getRequestId()}], methodName=[${methodName}], message=[${message}], optionalParams=[${optionalParams ? JSON.stringify(optionalParams) : ''}]`,
    );
  }

  error(methodName: string, message?: string, optionalParams?: any) {
    super.error(
      `requestId=[${this.#getRequestId()}], methodName=[${methodName}], message=[${message}], optionalParams=[${optionalParams ? JSON.stringify(optionalParams) : ''}]`,
    );
  }

  warn(methodName: string, message?: string, optionalParams?: any) {
    super.warn(
      `requestId=[${this.#getRequestId()}], methodName=[${methodName}], message=[${message}], optionalParams=[${optionalParams ? JSON.stringify(optionalParams) : ''}]`,
    );
  }

  debug(methodName: string, message?: string, optionalParams?: any) {
    super.debug(
      `requestId=[${this.#getRequestId()}], methodName=[${methodName}], message=[${message}], optionalParams=[${optionalParams ? JSON.stringify(optionalParams) : ''}]`,
    );
  }

  verbose(methodName: string, message?: string, optionalParams?: any) {
    super.verbose(
      `requestId=[${this.#getRequestId()}], methodName=[${methodName}], message=[${message}], optionalParams=[${optionalParams ? JSON.stringify(optionalParams) : ''}]`,
    );
  }
}
