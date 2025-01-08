import { Module } from '@nestjs/common';
import { ConcertController } from './controller/concert.controller';
import { ConcertScheduler } from './controller/concert.scheduler';
import { ConcertService } from './service/concert.service';
import { ConcertRepository } from './repository/concert.repository';
import { SeatRepository } from './repository/seat.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConcertEntity, ConcertScheduleEntity, SeatEntity } from '../entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConcertEntity,
      ConcertScheduleEntity,
      SeatEntity,
    ]),
  ],
  providers: [
    ConcertScheduler,
    ConcertService,
    ConcertRepository,
    SeatRepository,
  ],
  controllers: [ConcertController],
})
export class ConcertModule {}
