import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TokenEntity } from '../src/entity';
import { getDataSource } from '../src/config/typeorm-factory';
import { v4 } from 'uuid';

(async () => {
  await NestFactory.create(AppModule, {});

  const dataSource = getDataSource();

  const repo = dataSource.getRepository(TokenEntity);

  const date = new Date();
  for (let i = 1; i <= 100000; i++) {
    await repo.insert({
      userId: i,
      tokenValue: v4(),
      issuedDate: date,
      expiredDate: date,
      status: 'WAIT',
    });
  }

  process.exit(0);
})();
