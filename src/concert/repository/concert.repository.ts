import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConcertEntity } from '../../entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class ConcertRepository {
  constructor(
    @InjectRepository(ConcertEntity)
    private readonly repository: Repository<ConcertEntity>,
  ) {}

  #getRepo(mgr?: EntityManager) {
    return mgr ? mgr.getRepository(ConcertEntity) : this.repository;
  }
}
