import { Module } from '@nestjs/common';
import { ConcertController } from './concert.controller';

@Module({
  controllers: [ConcertController]
})
export class ConcertModule {}
