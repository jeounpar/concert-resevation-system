import { Injectable } from '@nestjs/common';
import { ConfigReader } from './config.reader';

@Injectable()
export class RedisConfig {
  private readonly _host: string;
  private readonly _port: number;
  private readonly _password?: string;

  constructor(private readonly _configReader: ConfigReader) {
    const password = this._configReader.readMandatory('REDIS_PASSWORD');
    this._host = this._configReader.readMandatory('REDIS_HOST');
    this._port = Number(this._configReader.readMandatory('REDIS_PORT'));
    this._password = password === 'NO_PASSWORD' ? undefined : password;
  }

  public get host() {
    return this._host;
  }

  public get port() {
    return this._port;
  }

  public get password() {
    return this._password;
  }
}
