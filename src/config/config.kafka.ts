import { Injectable } from '@nestjs/common';
import { ConfigReader } from './config.reader';

@Injectable()
export class KafkaConfig {
  private readonly _broker: string;
  private readonly _topic: string;
  private readonly _clientId: string;
  private readonly _groupId: string;

  constructor(private readonly _configReader: ConfigReader) {
    this._broker = this._configReader.readMandatory('KAFKA_BROKER');
    this._clientId = this._configReader.readMandatory('KAFKA_CLIENT_ID');
    this._groupId = this._configReader.readMandatory('KAFKA_GROUP_ID');
    this._topic = this._configReader.readMandatory('KAFKA_TOPIC');
  }

  get broker(): string {
    return this._broker;
  }

  get topic(): string {
    return this._topic;
  }

  get clientId(): string {
    return this._clientId;
  }

  get groupId(): string {
    return this._groupId;
  }
}
