import { Injectable } from '@nestjs/common';
import { ConfigReader } from './config.reader';

@Injectable()
export class DatabaseConfig {
  private readonly _host: string;
  private readonly _port: number;
  private readonly _database: string;
  private readonly _user: string;
  private readonly _password: string;
  private readonly _poolSize: number;

  constructor(private readonly _configReader: ConfigReader) {
    this._host = this._configReader.readMandatory('MYSQL_HOST');
    this._port = Number(this._configReader.readMandatory('MYSQL_PORT'));
    this._database = this._configReader.readMandatory('MYSQL_DATABASE');
    this._user = this._configReader.readMandatory('MYSQL_USER');
    this._password = this._configReader.readMandatory('MYSQL_PASSWORD');
    this._poolSize = Number(
      this._configReader.readMandatory('MYSQL_CONNECTION_LIMIT'),
    );
  }

  public get host() {
    return this._host;
  }

  public get port() {
    return this._port;
  }

  public get database() {
    return this._database;
  }

  public get user() {
    return this._user;
  }

  public get password() {
    return this._password;
  }

  public get poolSize(): number {
    return this._poolSize;
  }
}
