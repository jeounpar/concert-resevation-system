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
    ScheduleModule.forRoot(),
    TokenModule,
    ConcertModule,
    PointModule,
    PaymentModule,
    LogModule,
    MyRedisModule,
  ],
  controllers: [AppController],
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
      )
      .forRoutes('*');
  }
}
