import { DataSource, DataSourceOptions } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DatabaseConfig } from './config.database';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { TestEntity } from '../entity/test.entity';

export async function dataSourceFactory(
  options: DataSourceOptions,
): Promise<DataSource> {
  const initialized = await new DataSource(options).initialize();
  await inspectConnection(initialized);
  return addTransactionalDataSource(initialized);
}

async function inspectConnection(datasource: DataSource) {
  await datasource.query('SELECT 1');
}

function getAllTypeOrmModels() {
  return [TestEntity];
}

export function dataSourceOptionsFactory(
  config: DatabaseConfig,
): DataSourceOptions {
  const { host, port, user, password, database, poolSize } = config;
  return {
    type: 'mysql',
    timezone: '+00:00',
    entityPrefix: 'hhplus_',
    extra: {
      decimalNumbers: true,
    },
    host,
    port,
    username: user,
    password,
    database,
    poolSize,
    entities: getAllTypeOrmModels(),
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false,
    logging: false,
  };
}
