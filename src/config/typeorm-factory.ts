import { DataSource, DataSourceOptions } from 'typeorm';
import { DatabaseConfig } from './config.database';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as Entities from '../entity';

let dataSource: DataSource;

export async function dataSourceFactory(
  options: DataSourceOptions,
): Promise<DataSource> {
  dataSource = await new DataSource(options).initialize();
  await inspectConnection(dataSource);

  return dataSource;
}

export function getDataSource() {
  return dataSource;
}

async function inspectConnection(datasource: DataSource) {
  await datasource.query('SELECT 1');
}

export function getAllTypeOrmModels() {
  return Object.values(Entities).filter((model) => typeof model === 'function');
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
    synchronize: true,
    logging: false,
  };
}
