import { Module } from '@nestjs/common';
import { MyCustomLogger } from './my-custom-logger';
import { AsyncLocalStorageService } from './async-local-storage.service';

@Module({
  providers: [MyCustomLogger, AsyncLocalStorageService],
  exports: [MyCustomLogger, AsyncLocalStorageService],
})
export class LogModule {}
