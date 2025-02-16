import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KafkaConfig } from './config/config.kafka';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    @Inject(KafkaConfig) private readonly kafkaConfig: KafkaConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaClient.connect();
  }

  async publishMessageTest(message: string) {
    this.kafkaClient.emit(this.kafkaConfig.topic, message);
  }

  getHello(): string {
    return 'Hello World!';
  }
}
