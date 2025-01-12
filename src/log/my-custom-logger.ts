import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class MyCustomLogger extends ConsoleLogger {
  constructor(context?: string) {
    super(context);
  }

  log(message: string) {
    super.log(`[Log] ${message}`);
  }

  error(message: string, trace?: string) {
    super.error(`[Error] ${message}`, trace);
  }

  warn(message: string) {
    super.warn(`[Warn] ${message}`);
  }

  debug(message: string) {
    super.debug(`[Debug] ${message}`);
  }

  verbose(message: string) {
    super.verbose(`[Verbose] ${message}`);
  }
}
