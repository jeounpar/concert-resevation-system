import { Module } from '@nestjs/common';
import { ConcertController } from './controller/concert.controller';
import { ConcertScheduler } from './controller/concert.scheduler';
import { ConcertService } from './service/concert.service';
import { ConcertScheduleRepository } from './repository/concert-schedule.repository';
import { SeatRepository } from './repository/seat.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConcertEntity, ConcertScheduleEntity, SeatEntity } from '../../entity';
import { LogModule } from '../../log/log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConcertEntity,
      ConcertScheduleEntity,
      SeatEntity,
    ]),
    LogModule,
  ],
  providers: [
    ConcertScheduler,
    ConcertService,
    ConcertScheduleRepository,
    SeatRepository,
  ],
  exports: [ConcertService],
  controllers: [ConcertController],
})
export class ConcertModule {}
