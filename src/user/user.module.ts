import { Module } from '@nestjs/common';
import { UserReaderComponent } from './user-reader.component';

@Module({
  providers: [UserReaderComponent],
  exports: [UserReaderComponent],
})
export class UserModule {}
