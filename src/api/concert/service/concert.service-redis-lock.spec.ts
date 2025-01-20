import { TestingModule } from '@nestjs/testing';
import { ConcertService } from './concert.service';
import { DataSource } from 'typeorm';
import { StartedMySqlContainer } from '@testcontainers/mysql';
import { SeatEntity } from '../../../entity';
import { ConcertModule } from '../concert.module';
import { initializeTestModule } from '../../../../util/test-util-for-test-container';
import { StartedRedisContainer } from '@testcontainers/redis';

describe('ConcertService Redis Test', () => {
  jest.setTimeout(50000);
  let module: TestingModule;
  let concertService: ConcertService;
  let dataSource: DataSource;
  let mysqlContainer: StartedMySqlContainer;
  let redisContainer: StartedRedisContainer;
  const totalUser = 10000;
  const userIds = Array.from({ length: totalUser }, (_, i) => i + 1);

  beforeAll(async () => {
    const result = await initializeTestModule(ConcertModule);
    module = result.module;
    dataSource = result.dataSource;
    mysqlContainer = result.mysqlContainer;
    redisContainer = result.redisContainer;

    concertService = module.get<ConcertService>(ConcertService);
  });

  beforeEach(async () => {
    const repository = dataSource.getRepository(SeatEntity);
    await repository.clear();

    await repository.save({
      id: 1,
      status: 'EMPTY',
      price: 100,
      seatNumber: 1,
      concertScheduleId: 1,
      expireDate: null,
    });
  });

  afterAll(async () => {
    await module.close();
    await mysqlContainer.stop();
    await redisContainer.stop();
  });

  describe(`${totalUser}명의 유저가 동시에 같은 좌석을 예약할 때 1명만 성공해야 한다.`, () => {
    it('Redis Spin Lock', async () => {
      const reservationPromises = userIds.map(async (userId) => {
        try {
          return await concertService.reserveWithRedisLock({
            seatId: 1,
            userId,
          });
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
      expect(failedReservations.length).toBe(totalUser - 1);

      const reservedSeat = await dataSource.getRepository(SeatEntity).findOne({
        where: { id: 1 },
      });
      expect(reservedSeat.userId).toBe(successfulReservations[0].userId);
      expect(reservedSeat.status).toBe('RESERVED');
    });
  });
});
