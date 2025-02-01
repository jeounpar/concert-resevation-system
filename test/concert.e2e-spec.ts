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
import { TokenService } from '../src/api/token/service/token.service';
import { ConcertScheduleEntity, SeatEntity } from '../src/entity';
import { TokenModule } from '../src/api/token/token.module';
import { ConcertModule } from '../src/api/concert/concert.module';
import { PointModule } from '../src/api/point/point.module';
import { PaymentModule } from '../src/api/payment/payment.module';
import { LogModule } from '../src/log/log.module';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from '../src/interceptor/my-logging.interceptor';
import { GenerateRequestIdMiddleware } from '../src/middleware/generate-request-id.middleware';
import { TokenVerifyMiddleware } from '../src/middleware/token-verify.middleware';
import { TOKEN_POLICY } from '../src/policy';
import { MyRedisModule } from '../src/redis';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule } from '../src/config/config.module';
import { RedisConfig } from '../src/config/config.redis';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

describe('Concert (e2e)', () => {
  jest.setTimeout(100000);
  let app: INestApplication;
  let tokenService: TokenService;
  let mysqlContainer: StartedMySqlContainer;
  let redisContainer: StartedRedisContainer;
  let dataSource: DataSource;
  let seatEntity: SeatEntity;

  beforeAll(async () => {
    mysqlContainer = await new MySqlContainer('mysql')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withUserPassword('test_password')
      .start();

    redisContainer = await new RedisContainer().withExposedPorts(6379).start();

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
          poolSize: 50,
          synchronize: true,
          logging: false,
        }),
        RedisModule.forRootAsync({
          imports: [ConfigModule],
          inject: [RedisConfig],
          useFactory: async () => ({
            type: 'single',
            options: {
              host: redisContainer.getHost(),
              port: redisContainer.getMappedPort(6379),
            },
          }),
        }),
        TokenModule,
        ConcertModule,
        PointModule,
        PaymentModule,
        LogModule,
        RedisModule,
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

    // 콘서트 스케쥴 데이터 생성
    const concertScheduleRepositoryOrm = dataSource.getRepository(
      ConcertScheduleEntity,
    );
    await concertScheduleRepositoryOrm.save({
      id: 1,
      concertId: 1,
      theDateString: '2025-01-03',
    });

    // 좌석 데이터 생성
    const seatRepositoryOrm = dataSource.getRepository(SeatEntity);

    seatEntity = new SeatEntity();
    seatEntity.id = 1;
    seatEntity.status = 'EMPTY';
    seatEntity.price = 2000;
    seatEntity.seatNumber = 1;
    seatEntity.concertScheduleId = 1;
    seatEntity.expireDate = null;

    await seatRepositoryOrm.save(seatEntity);
  });

  afterAll(async () => {
    await app.close();
    await mysqlContainer.stop();
  });

  it(`
   *
   * 1. 100명의 유저에게 각 5000 point 충전
   * 2. 100명의 유저가 동시에 대기열 토큰을 발급
   * 3. 토큰을 활성화 상태로 변경 (스케쥴러가 한번 돌아갔다고 생각)
   * 4. 예약 가능 날짜 조회
   * 5. 예약 가능 좌석 조회
   * 6. 100명의 유저가 하나의 좌석에 대해 예약 요청 -> 1명만 성공하고 999명은 실패
   * 7. 예약을 성공한 유저가 예약한 좌석에 대해 결제 요청 -> 성공
   * 8. 결제에 성공한 유저의 토큰이 삭제되었는지 확인
   * 9. 결제에 성공한 유저의 남은 포인트 조회
   *`, async () => {
    const totalUserCount = 100;
    const userIds = Array.from({ length: totalUserCount }, (_, i) => i + 1);
    const chargeAmount = 5000;

    // 1. 100명의 유저에게 각 5000 point 충전
    for (const userId of userIds) {
      const response = await request(app.getHttpServer())
        .post(`/point/${userId}/charge`)
        .send({ amount: chargeAmount });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        userId,
        chargePoint: chargeAmount,
        remainPoint: chargeAmount,
      });
    }

    // 2. 100명의 유저가 동시에 대기열 토큰을 발급
    const tokenIssueResponse = await Promise.all(
      userIds.map(async (userId) => {
        const response = await request(app.getHttpServer())
          .post('/token/issue')
          .send({ userId });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('tokenValue');
        expect(response.body).toHaveProperty('userId', userId);

        return { userId, tokenValue: response.body.tokenValue };
      }),
    );

    // 3. 토큰을 활성화 상태로 변경 (스케쥴러가 한번 돌아갔다고 생각)
    await tokenService.activeToken({});

    const concertId = 1;

    // 4. 예약 가능 날짜 조회
    const availableTimesResponses = await Promise.all(
      tokenIssueResponse.map(async ({ userId, tokenValue }) => {
        const response = await request(app.getHttpServer())
          .get(`/concert/${concertId}/available-times`)
          .set('x-queue-token', tokenValue);
        return { userId, status: response.status };
      }),
    );
    expect(availableTimesResponses.filter((e) => e.status === 200).length).toBe(
      TOKEN_POLICY.MAX_ACTIVE_TOKEN_COUNT,
    );
    expect(availableTimesResponses.filter((e) => e.status !== 200).length).toBe(
      totalUserCount - TOKEN_POLICY.MAX_ACTIVE_TOKEN_COUNT,
    );

    // 5. 예약 가능 좌석 조회
    const availableSeatsResponses = await Promise.all(
      tokenIssueResponse.map(async ({ userId, tokenValue }) => {
        const response = await request(app.getHttpServer())
          .get(`/concert/${concertId}/available-seats?date=2025-01-03`)
          .set('x-queue-token', tokenValue);
        return { userId, status: response.status };
      }),
    );
    expect(availableSeatsResponses.filter((e) => e.status === 200).length).toBe(
      TOKEN_POLICY.MAX_ACTIVE_TOKEN_COUNT,
    );
    expect(availableSeatsResponses.filter((e) => e.status !== 200).length).toBe(
      totalUserCount - TOKEN_POLICY.MAX_ACTIVE_TOKEN_COUNT,
    );

    // 6. 100명의 유저가 하나의 좌석에 대해 예약 요청 -> 1명만 성공하고 99명은 실패
    const seatId = 1;
    const reservationResults = await Promise.all(
      tokenIssueResponse.map(async ({ userId, tokenValue }) => {
        const response = await request(app.getHttpServer())
          .post('/concert/reservation')
          .set('x-queue-token', tokenValue)
          .send({ seatId, userId });

        return { userId, status: response.status, body: response.body };
      }),
    );

    const successReservations = reservationResults.filter(
      (res) => res.status === 201,
    );
    const failedReservations = reservationResults.filter(
      (res) => res.status !== 201,
    );

    expect(successReservations.length).toBe(1);
    expect(failedReservations.length).toBe(totalUserCount - 1);

    // 7. 예약을 성공한 유저가 예약한 좌석에 대해 결제 요청 -> 성공
    const successfulUserId = successReservations[0].userId;
    const successfulToken = tokenIssueResponse.find(
      (t) => t.userId === successfulUserId,
    )?.tokenValue;

    const paymentResponse = await request(app.getHttpServer())
      .post('/payment/concert')
      .set('x-queue-token', successfulToken)
      .send({ seatId, userId: successfulUserId });

    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body).toHaveProperty('concertInfo');
    expect(paymentResponse.body.concertInfo).toEqual({
      userId: successfulUserId,
      seatNumber: 1,
      status: 'PAID',
      expiredDate: null,
      price: seatEntity.price,
    });
    expect(paymentResponse.body).toHaveProperty('pointInfo');
    expect(paymentResponse.body.pointInfo).toEqual({
      userId: successfulUserId,
      remainPoint: 5000 - seatEntity.price,
    });

    // 8. 결제에 성공한 유저의 토큰이 삭제되었는지 확인
    const response = await request(app.getHttpServer())
      .get(`/concert/${concertId}/available-times`)
      .set('x-queue-token', successfulToken)
      .send({ seatId });
    expect(response.status).toBe(400);

    // 9. 결제에 성공한 유저의 남은 포인트 조회
    const pointResponse = await request(app.getHttpServer()).get(
      `/point/${successfulUserId}`,
    );
    expect(pointResponse.status).toBe(200);
    expect(pointResponse.body).toEqual({
      userId: successfulUserId,
      remainPoint: 5000 - seatEntity.price,
    });
  });
});
