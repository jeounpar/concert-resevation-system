import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '../config/config.module';
import { KafkaConfig } from '../config/config.kafka';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [KafkaConfig],
        useFactory: (kafkaConfig: KafkaConfig) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: kafkaConfig.clientId,
              brokers: [kafkaConfig.broker],
            },
            consumer: {
              groupId: kafkaConfig.groupId,
            },
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
