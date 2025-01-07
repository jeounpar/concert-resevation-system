import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PointEntity } from '../../entity';

@Injectable()
export class PointRepository {
  constructor(
    @InjectRepository(PointEntity)
    private readonly pointRepository: PointRepository,
  ) {}
}
