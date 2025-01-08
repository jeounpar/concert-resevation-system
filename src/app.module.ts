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
import { TokenModule } from './token/token.module';
import { ConcertModule } from './concert/concert.module';
import { PointModule } from './point/point.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenVerifyMiddleware } from './middleware/token-verify.middleware';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [DatabaseConfig],
      useFactory: dataSourceOptionsFactory,
      dataSourceFactory: dataSourceFactory,
    }),
    ScheduleModule.forRoot(),
    TokenModule,
    ConcertModule,
    PointModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
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
