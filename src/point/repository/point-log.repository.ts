import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PointLogEntity } from '../../entity';

@Injectable()
export class PointLogRepository {
  constructor(
    @InjectRepository(PointLogEntity)
    private readonly pointRepository: PointLogEntity,
  ) {}
}
