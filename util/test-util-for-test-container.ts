import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { getAllEntities, setDataSource } from '../src/config/typeorm-factory';
import { RedisModule } from '@nestjs-modules/ioredis';
import { MyRedisModule } from '../src/redis';
import { CqrsModule } from '@nestjs/cqrs';

export async function initializeTestModule(...moduleClasses: any[]): Promise<{
  module: TestingModule;
  dataSource: DataSource;
  mysqlContainer: StartedMySqlContainer;
  redisContainer: StartedRedisContainer;
}> {
  const mysqlContainer = await new MySqlContainer()
    .withDatabase('test_db')
    .withUsername('test_user')
    .withUserPassword('test_password')
    .start();

  const redisContainer = await new RedisContainer()
    .withExposedPorts(6379)
    .start();

  const module = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'mysql',
        host: mysqlContainer.getHost(),
        port: mysqlContainer.getPort(),
        username: mysqlContainer.getUsername(),
        password: mysqlContainer.getUserPassword(),
        database: mysqlContainer.getDatabase(),
        entities: getAllEntities(),
        synchronize: true,
        logging: false,
      }),
      TypeOrmModule.forFeature(getAllEntities()),
      RedisModule.forRootAsync({
        useFactory: async () => ({
          type: 'single',
          options: {
            host: redisContainer.getHost(),
            port: redisContainer.getMappedPort(6379),
          },
        }),
      }),
      CqrsModule.forRoot(),
      MyRedisModule,
      ...moduleClasses,
    ],
  }).compile();

  const dataSource = module.get<DataSource>(DataSource);
  setDataSource(dataSource);

  return { module, dataSource, mysqlContainer, redisContainer };
}
