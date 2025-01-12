import { Module } from '@nestjs/common';
import { MyCustomLogger } from './my-custom-logger';

@Module({
  providers: [MyCustomLogger],
  exports: [MyCustomLogger],
})
export class LogModule {}
