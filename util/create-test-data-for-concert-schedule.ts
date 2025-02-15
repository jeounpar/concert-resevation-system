import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ConcertScheduleEntity } from '../src/entity';
import { getDataSource } from '../src/config/typeorm-factory';

(async () => {
  await NestFactory.create(AppModule, {});

  const dataSource = getDataSource();

  const repo = dataSource.getRepository(ConcertScheduleEntity);

  for (let i = 1; i <= 1_000_000; i++) {
    const concertId = (i % 1000) + 1;
    await repo.insert({
      concertId: concertId,
      theDateString: '2024-' + i + '-' + concertId,
    });
  }

  process.exit(0);
})();
