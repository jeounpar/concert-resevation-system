import { Test, TestingModule } from '@nestjs/testing';
import { PaymentFacade } from './payment.facade';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { getAllEntities, setDataSource } from '../../config/typeorm-factory';
import { PointEntity, SeatEntity } from '../../entity';
import { CannotPaidError, NotFoundError, PointNotEnough } from '../../error';
import { ConcertModule } from '../../concert/concert.module';
import { PointModule } from '../../point/point.module';
import { PaymentModule } from '../payment.module';
import * as dayjs from 'dayjs';
import { CONCERT_POLICY } from '../../policy';

describe('PaymentFacade', () => {
  jest.setTimeout(30000);
  let module: TestingModule;
  let paymentFacade: PaymentFacade;
  let dataSource: DataSource;
  let mysqlContainer: StartedMySqlContainer;
  let ormSeatRepository: Repository<SeatEntity>;
  let ormPointRepository: Repository<PointEntity>;

  beforeAll(async () => {
    mysqlContainer = await new MySqlContainer('mysql')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withUserPassword('test_password')
      .start();

    module = await Test.createTestingModule({
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
        TypeOrmModule.forFeature(getAllEntities()),
        ConcertModule,
        PointModule,
        PaymentModule,
      ],
    }).compile();

    paymentFacade = module.get<PaymentFacade>(PaymentFacade);
    dataSource = module.get<DataSource>(DataSource);
    setDataSource(dataSource);
    ormSeatRepository = dataSource.getRepository(SeatEntity);
    ormPointRepository = dataSource.getRepository(PointEntity);
  });

  beforeEach(async () => {
    const entities = getAllEntities();
    for (const entity of entities) {
      await dataSource.getRepository(entity).clear();
    }
  });

  afterAll(async () => {
    await module.close();
    await mysqlContainer.stop();
  });

  it('좌석을 결제하고 포인트를 사용한다.', async () => {
    await ormSeatRepository.save({
      id: 1,
      userId: 1,
      status: 'RESERVED',
      price: 100,
      seatNumber: 1,
      concertScheduleId: 1,
      expireDate: dayjs()
        .add(CONCERT_POLICY.EXPIRED_TIME_MIN, 'minute')
        .toDate(),
    });

    await ormPointRepository.save({
      userId: 1,
      remainPoint: 200,
    });

    const result = await paymentFacade.concertPayment({ seatId: 1, userId: 1 });

    expect(result).toBeDefined();
    expect(result.concertInfo.status).toBe('PAID');
    expect(result.pointInfo.remainPoint).toBe(100); // 200 - 100 = 100
  });

  it('예약을 안한 좌석은 결제를 할 수 없다.', async () => {
    await ormSeatRepository.save({
      id: 1,
      userId: 1,
      status: 'EMPTY',
      price: 100,
      seatNumber: 1,
      concertScheduleId: 1,
      expireDate: dayjs()
        .add(CONCERT_POLICY.EXPIRED_TIME_MIN, 'minute')
        .toDate(),
    });

    await ormPointRepository.save({
      userId: 1,
      remainPoint: 200,
    });

    await expect(
      paymentFacade.concertPayment({ seatId: 1, userId: 1 }),
    ).rejects.toThrow(CannotPaidError);
  });

  it('예약이 만료된 좌석은 결제할 수 없다.', async () => {
    await ormSeatRepository.save({
      id: 1,
      userId: 1,
      status: 'RESERVED',
      price: 100,
      seatNumber: 1,
      concertScheduleId: 1,
      expireDate: dayjs()
        .subtract(CONCERT_POLICY.EXPIRED_TIME_MIN, 'minute')
        .toDate(),
    });

    await ormPointRepository.save({
      userId: 1,
      remainPoint: 200,
    });

    await expect(
      paymentFacade.concertPayment({ seatId: 1, userId: 1 }),
    ).rejects.toThrow(CannotPaidError);
  });

  it('포인트 부족 시 결제는 실패한다.', async () => {
    await ormSeatRepository.save({
      id: 1,
      userId: 1,
      status: 'RESERVED',
      price: 500,
      seatNumber: 1,
      concertScheduleId: 1,
      expireDate: dayjs()
        .add(CONCERT_POLICY.EXPIRED_TIME_MIN, 'minute')
        .toDate(),
    });

    await ormPointRepository.save({
      userId: 1,
      remainPoint: 100,
    });

    await expect(
      paymentFacade.concertPayment({ seatId: 1, userId: 1 }),
    ).rejects.toThrow(PointNotEnough);
  });

  it('존재하지 않는 좌석 결제 시도 시 에러를 던진다.', async () => {
    await expect(
      paymentFacade.concertPayment({ seatId: 999, userId: 1 }),
    ).rejects.toThrow(NotFoundError);
  });
});
