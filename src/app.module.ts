import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './config/config.database';
import {
  dataSourceFactory,
  dataSourceOptionsFactory,
} from './config/typeorm-factory';
import { TokenModule } from './api/token/token.module';
import { ConcertModule } from './api/concert/concert.module';
import { PointModule } from './api/point/point.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenVerifyMiddleware } from './middleware/token-verify.middleware';
import { PaymentModule } from './api/payment/payment.module';
import { LogModule } from './log/log.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './interceptor/my-logging.interceptor';
import { GenerateRequestIdMiddleware } from './middleware/generate-request-id.middleware';
import { RedisConfig } from './config/config.redis';
import { redisOptionsFactory } from './config/redis-factory';
import { RedisModule } from '@nestjs-modules/ioredis';
import { MyRedisModule } from './redis';
import { ExternalDataPlatformModule } from './external';
import { CqrsModule } from '@nestjs/cqrs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaConfig } from './config/config.kafka';
import { AppKafkaConsumer } from './app-kafka.consumer';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [DatabaseConfig],
      useFactory: dataSourceOptionsFactory,
      dataSourceFactory: dataSourceFactory,
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [RedisConfig],
      useFactory: redisOptionsFactory,
    }),
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
    ScheduleModule.forRoot(),
    CqrsModule.forRoot(),
    TokenModule,
    ConcertModule,
    PointModule,
    PaymentModule,
    LogModule,
    MyRedisModule,
    ExternalDataPlatformModule,
  ],
  controllers: [AppController, AppKafkaConsumer],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(GenerateRequestIdMiddleware).forRoutes('*');
    consumer
      .apply(TokenVerifyMiddleware)
      .exclude(
        { path: 'token', method: RequestMethod.ALL },
        { path: 'token/(.*)', method: RequestMethod.ALL },
        { path: 'user', method: RequestMethod.ALL },
        { path: 'user/(.*)', method: RequestMethod.ALL },
        { path: 'point', method: RequestMethod.ALL },
        { path: 'point/(.*)', method: RequestMethod.ALL },
        { path: 'publish', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
