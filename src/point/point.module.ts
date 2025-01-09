import { Module } from '@nestjs/common';
import { PointController } from './controller/point.controller';
import { PointService } from './service/point.service';
import { PointRepository } from './repository/point.repository';
import { PointLogRepository } from './repository/point-log.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointEntity, PointLogEntity } from '../entity';

@Module({
  imports: [TypeOrmModule.forFeature([PointEntity, PointLogEntity])],
  providers: [PointService, PointRepository, PointLogRepository],
  controllers: [PointController],
  exports: [PointService],
})
export class PointModule {}
