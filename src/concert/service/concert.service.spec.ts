import { Test, TestingModule } from '@nestjs/testing';
import { ConcertService } from './concert.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getAllEntities, setDataSource } from '../../config/typeorm-factory';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { SeatEntity } from '../../entity';
import {
  CannotPaidError,
  CannotReserveError,
  NotFoundError,
} from '../../error';
import * as dayjs from 'dayjs';
import { CONCERT_POLICY } from '../../policy';
import { ConcertModule } from '../concert.module';

describe('ConcertService ', () => {
  jest.setTimeout(50000);
  let module: TestingModule;
  let concertService: ConcertService;
  let dataSource: DataSource;
  let mysqlContainer: StartedMySqlContainer;

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
      ],
    }).compile();

    concertService = module.get<ConcertService>(ConcertService);
    dataSource = module.get<DataSource>(DataSource);
    setDataSource(dataSource);
  });

  beforeEach(async () => {
    const repository = dataSource.getRepository(SeatEntity);
    await repository.clear();
  });

  afterAll(async () => {
    await module.close();
    await mysqlContainer.stop();
  });

  describe('좌석 예약 ', () => {
    it('유저가 좌석을 예약한다.', async () => {
      const nowDate = new Date();

      const seatRepositoryOrm = dataSource.getRepository(SeatEntity);
      await seatRepositoryOrm.save({
        id: 1,
        status: 'EMPTY',
        price: 100,
        seatNumber: 1,
        concertScheduleId: 1,
        expireDate: dayjs(nowDate)
          .add(CONCERT_POLICY.EXPIRED_TIME_MIN, 'minute')
          .toDate(),
      });

      const result = await concertService.reserve({
        seatId: 1,
        userId: 1,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('RESERVED');
    });

    it('예약되어 있거나 결제된 좌석은 예약을 할 수 없다.', async () => {
      const seatRepositoryOrm = dataSource.getRepository(SeatEntity);
      await seatRepositoryOrm.save([
        {
          id: 1,
          status: 'RESERVED',
          price: 100,
          seatNumber: 1,
          concertScheduleId: 1,
          expireDate: null,
        },
        {
          id: 2,
          status: 'PAID',
          price: 100,
          seatNumber: 2,
          concertScheduleId: 1,
          expireDate: null,
        },
      ]);

      await expect(
        concertService.reserve({
          seatId: 1,
          userId: 1,
        }),
      ).rejects.toThrow(CannotReserveError);
      await expect(
        concertService.reserve({
          seatId: 2,
          userId: 1,
        }),
      ).rejects.toThrow(CannotReserveError);
    });

    it('10명의 유저가 동시에 같은 좌석을 예약할 때 1명만 성공해야 한다.', async () => {
      const seatRepositoryOrm = dataSource.getRepository(SeatEntity);
      await seatRepositoryOrm.save({
        id: 1,
        status: 'EMPTY',
        price: 100,
        seatNumber: 1,
        concertScheduleId: 1,
        expireDate: null,
      });

      const userIds = Array.from({ length: 10 }, (_, i) => i + 1);
      const reservationPromises = userIds.map(async (userId) => {
        try {
          return await concertService.reserve({ seatId: 1, userId });
        } catch (error) {
          return error;
        }
      });

      const results = await Promise.all(reservationPromises);

      const successfulReservations = results.filter(
        (result) => !(result instanceof Error),
      );

      const failedReservations = results.filter(
        (result) => result instanceof Error,
      );

      expect(successfulReservations.length).toBe(1);
      expect(failedReservations.length).toBe(9);
      failedReservations.forEach((error) => {
        expect(error).toBeInstanceOf(CannotReserveError);
      });

      const reservedSeat = await seatRepositoryOrm.findOne({
        where: { id: 1 },
      });

      expect(reservedSeat.userId).toBe(successfulReservations[0].userId);
      expect(reservedSeat.status).toBe('RESERVED');
    });

    it('존재하지 않는 좌석 예약 시도 시 에러를 던진다.', async () => {
      await expect(
        concertService.reserve({ seatId: 999, userId: 1 }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('좌석 결제 ', () => {
    it('좌석을 결제한다.', async () => {
      const nowDate = new Date();
      const userId = 1;

      const seatRepositoryOrm = dataSource.getRepository(SeatEntity);
      await seatRepositoryOrm.save({
        id: 1,
        userId,
        status: 'RESERVED',
        price: 100,
        seatNumber: 1,
        concertScheduleId: 1,
        expireDate: dayjs(nowDate)
          .add(CONCERT_POLICY.EXPIRED_TIME_MIN, 'minute')
          .toDate(),
      });

      const result = await concertService.paid({
        seatId: 1,
        userId,
        nowDate: new Date(),
      });

      expect(result.status).toBe('PAID');
    });

    it('만료된 좌석은 결제를 할 수 없다.', async () => {
      const nowDate = new Date();
      const userId = 1;

      const seatRepositoryOrm = dataSource.getRepository(SeatEntity);
      await seatRepositoryOrm.save({
        id: 1,
        userId,
        status: 'RESERVED',
        price: 100,
        seatNumber: 1,
        concertScheduleId: 1,
        expireDate: dayjs(nowDate)
          .subtract(CONCERT_POLICY.EXPIRED_TIME_MIN + 1, 'minute')
          .toDate(),
      });

      await expect(
        concertService.paid({
          seatId: 1,
          userId,
          nowDate,
        }),
      ).rejects.toThrow(CannotPaidError);
    });

    it('예약한 유저외에 다른 유저는 해당 좌석을 결제할 수 없다.', async () => {
      const nowDate = new Date();
      const userId = 1;

      const seatRepositoryOrm = dataSource.getRepository(SeatEntity);
      await seatRepositoryOrm.save({
        id: 1,
        userId,
        status: 'RESERVED',
        price: 100,
        seatNumber: 1,
        concertScheduleId: 1,
        expireDate: dayjs(nowDate)
          .add(CONCERT_POLICY.EXPIRED_TIME_MIN, 'minute')
          .toDate(),
      });

      await expect(
        concertService.paid({
          seatId: 1,
          userId: 999,
          nowDate,
        }),
      ).rejects.toThrow(CannotPaidError);
    });
  });

  it('만료된 좌석을 EMPTY 상태로 변경한다.', async () => {
    const nowDate = new Date();
    const seatRepositoryOrm = dataSource.getRepository(SeatEntity);

    await seatRepositoryOrm.save({
      id: 1,
      status: 'RESERVED',
      price: 100,
      seatNumber: 1,
      concertScheduleId: 1,
      expireDate: dayjs(nowDate)
        .subtract(CONCERT_POLICY.EXPIRED_TIME_MIN + 1, 'minute')
        .toDate(),
    });

    await concertService.changeStatusToEmptyWithExpiredSeat({
      nowDate,
    });

    const updatedSeat = await seatRepositoryOrm.findOne({ where: { id: 1 } });
    expect(updatedSeat.status).toBe('EMPTY');
    expect(updatedSeat.expireDate).toBe(null);
  });
});
