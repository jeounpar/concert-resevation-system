import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConcertScheduleEntity } from '../../../entity';
import { EntityManager, Repository } from 'typeorm';
import { ConcertScheduleDomain } from '../domain/concert-schedule.domain';

@Injectable()
export class ConcertScheduleRepository {
  constructor(
    @InjectRepository(ConcertScheduleEntity)
    private readonly repository: Repository<ConcertScheduleEntity>,
  ) {}

  #getRepo(mgr?: EntityManager) {
    return mgr ? mgr.getRepository(ConcertScheduleEntity) : this.repository;
  }

  findMany(mgr?: EntityManager) {
    const repo = this.#getRepo(mgr);

    return {
      async concertId({ concertId }: { concertId: number }) {
        const entities = await repo.find({
          where: { concertId },
          relations: ['seats'],
        });

        return entities ? entities.map(ConcertScheduleDomain.fromEntity) : [];
      },
    };
  }

  findOne(mgr?: EntityManager) {
    const repo = this.#getRepo(mgr);

    return {
      async concertIdAndTheDate({
        concertId,
        theDateString,
      }: {
        concertId: number;
        theDateString: string;
      }) {
        const entity = await repo.findOne({
          where: { concertId, theDateString },
        });

        return entity ? ConcertScheduleDomain.fromEntity(entity) : null;
      },
    };
  }
}
