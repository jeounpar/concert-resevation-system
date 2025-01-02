import { Module } from '@nestjs/common';
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
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [DatabaseConfig],
      useFactory: dataSourceOptionsFactory,
      dataSourceFactory: dataSourceFactory,
    }),
    TokenModule,
    ConcertModule,
    PointModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
