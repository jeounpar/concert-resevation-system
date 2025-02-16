import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppKafkaConsumer implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  @MessagePattern('test-topic')
  handleMessage(@Payload() message: string) {
    console.log(
      '\x1b[35m📩 Received Kafka Message: \x1b[1;33m%s\x1b[0m',
      message,
    );
  }
}
