// test-utils.ts
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { getAllEntities, setDataSource } from '../src/config/typeorm-factory';

export async function initializeTestModule(moduleClass: any): Promise<{
  module: TestingModule;
  dataSource: DataSource;
  mysqlContainer: StartedMySqlContainer;
}> {
  const mysqlContainer = await new MySqlContainer('mysql')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withUserPassword('test_password')
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
      moduleClass,
    ],
  }).compile();

  const dataSource = module.get<DataSource>(DataSource);
  setDataSource(dataSource);

  return { module, dataSource, mysqlContainer };
}
