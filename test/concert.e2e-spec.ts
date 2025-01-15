import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { DataSource } from 'typeorm';
import { getAllEntities, setDataSource } from '../src/config/typeorm-factory';
import { TokenService } from '../src/token/service/token.service';
import { SeatEntity } from '../src/entity';
import { TokenModule } from '../src/token/token.module';
import { ConcertModule } from '../src/concert/concert.module';
import { PointModule } from '../src/point/point.module';
import { PaymentModule } from '../src/payment/payment.module';
import { LogModule } from '../src/log/log.module';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from '../src/interceptor/my-logging.interceptor';
import { GenerateRequestIdMiddleware } from '../src/middleware/generate-request-id.middleware';
import { TokenVerifyMiddleware } from '../src/middleware/token-verify.middleware';

describe('Concert (e2e)', () => {
  jest.setTimeout(50000);
  let app: INestApplication;
  let tokenService: TokenService;
  let mysqlContainer: StartedMySqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    mysqlContainer = await new MySqlContainer('mysql')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withUserPassword('test_password')
      .start();

    @Module({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: mysqlContainer.getHost(),
          port: mysqlContainer.getPort(),
          username: mysqlContainer.getUsername(),
          password: mysqlContainer.getUserPassword(),
          database: mysqlContainer.getDatabase(),
          entities: getAllEntities(),
          synchronize: true,
          logging: false,
        }),
        TokenModule,
        ConcertModule,
        PointModule,
        PaymentModule,
        LogModule,
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
    class TestAppModule implements NestModule {
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    setDataSource(dataSource);

    tokenService = moduleFixture.get(TokenService);
  });

  beforeEach(async () => {
    const entities = getAllEntities();
    for (const entity of entities) {
      await dataSource.getRepository(entity).clear();
    }

    // 좌석 데이터 생성
    const seatRepositoryOrm = dataSource.getRepository(SeatEntity);
    await seatRepositoryOrm.save({
      id: 1,
      status: 'EMPTY',
      price: 2000,
      seatNumber: 1,
      concertScheduleId: 1,
      expireDate: null,
    });
  });

  afterAll(async () => {
    await app.close();
    await mysqlContainer.stop();
  });
});
