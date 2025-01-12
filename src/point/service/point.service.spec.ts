import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { PointService } from './point.service';
import { PointRepository } from '../repository/point.repository';
import { PointLogRepository } from '../repository/point-log.repository';
import {
  getAllEntities,
  getDataSource,
  setDataSource,
} from '../../config/typeorm-factory';
import { NotFoundError, PointNotEnough } from '../../error';
import { PointLogEntity, TransactionConst } from '../../entity';
import { PointModule } from '../point.module';

describe('PointService', () => {
  jest.setTimeout(50000);

  let module: TestingModule;
  let pointService: PointService;
  let dataSource: DataSource;
  let ormPointLogRepository: Repository<PointLogEntity>;
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
        PointModule,
      ],
    }).compile();

    pointService = module.get<PointService>(PointService);
    dataSource = module.get<DataSource>(DataSource);
    setDataSource(dataSource);
    ormPointLogRepository = getDataSource().getRepository(PointLogEntity);
  });

  beforeEach(async () => {
    // 모든 엔티티 데이터 초기화
    const entities = getAllEntities();
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity);
      await repository.clear();
    }
  });

  afterAll(async () => {
    await module.close();
    await mysqlContainer.stop();
  });

  it('유저의 Point데이터가 없는 경우 포인트는 0을 리턴한다.', async () => {
    const response = await pointService.getByUserId({ userId: 999 });
    expect(response).toEqual({ userId: 999, remainPoint: 0 });
  });

  describe('charge', () => {
    it('Point데이터가 없는 유저가 충전을 시도하면 0포인트 데이터를 생성 후 포인트를 충전한다', async () => {
      const userId = 1;
      const amount = 100;

      const response = await pointService.charge({ userId, amount });
      const pointLogEntity = await ormPointLogRepository.findOne({
        where: { userId },
      });
      expect(response.userId).toBe(userId);
      expect(response.remainPoint).toBe(amount);

      expect(pointLogEntity.amount).toEqual(amount);
      expect(pointLogEntity.beforeAmount).toEqual(0);
      expect(pointLogEntity.afterAmount).toEqual(amount);
      expect(pointLogEntity.transaction).toEqual(TransactionConst.CHARGE);
    });

    it('유저에게 포인트를 충전한다.', async () => {
      const userId = 2;

      const initAmount = 100;
      await pointService.charge({ userId, amount: initAmount });

      const chargeAmount = 30;
      const response = await pointService.charge({
        userId,
        amount: chargeAmount,
      });

      const pointLogEntity = await ormPointLogRepository.findOne({
        where: { userId },
        order: { createDate: 'DESC' },
      });

      expect(response.userId).toBe(userId);
      expect(response.remainPoint).toBe(initAmount + chargeAmount);

      expect(pointLogEntity.amount).toEqual(chargeAmount);
      expect(pointLogEntity.beforeAmount).toEqual(initAmount);
      expect(pointLogEntity.afterAmount).toEqual(initAmount + chargeAmount);
      expect(pointLogEntity.transaction).toEqual(TransactionConst.CHARGE);
    });
  });

  describe('use', () => {
    it('포인트를 사용하면 로그가 정상적으로 저장된다.', async () => {
      const userId = 3;
      const initialAmount = 100;
      const useAmount = 40;

      await pointService.charge({ userId, amount: initialAmount });

      const response = await pointService.use({ userId, amount: useAmount });

      const pointLogEntity = await ormPointLogRepository.findOne({
        where: { userId },
        order: { createDate: 'DESC' },
      });

      expect(response.userId).toBe(userId);
      expect(response.remainPoint).toBe(initialAmount - useAmount);

      expect(pointLogEntity.amount).toEqual(useAmount);
      expect(pointLogEntity.beforeAmount).toEqual(initialAmount);
      expect(pointLogEntity.afterAmount).toEqual(initialAmount - useAmount);
      expect(pointLogEntity.transaction).toEqual(TransactionConst.USE);
    });

    it('사용자의 포인트가 부족할 경우 PointNotEnough 를 던진다.', async () => {
      const userId = 4;
      await pointService.charge({ userId, amount: 30 });

      await expect(pointService.use({ userId, amount: 50 })).rejects.toThrow(
        PointNotEnough,
      );
    });

    it('포인트가 없는 사용자가 사용을 시도하면 NotFoundError 를 던진다.', async () => {
      await expect(
        pointService.use({ userId: 999, amount: 10 }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('use - 동시성 테스트', () => {
    it('1000원이 있는 상태에서 동시에 15번 100원 사용 요청 시 최종 포인트가 0원이 된다.', async () => {
      const userId = 5;
      const initialAmount = 1000;
      const useAmount = 100;
      const requestCount = 15;

      await pointService.charge({ userId, amount: initialAmount });

      const useRequests = Array.from({ length: requestCount }, () =>
        pointService.use({ userId, amount: useAmount }),
      );

      await Promise.allSettled(useRequests);

      const finalPoint = await pointService.getByUserId({ userId });
      expect(finalPoint.remainPoint).toBe(0);
    });
  });

  describe('use & charge - 동시성 테스트', () => {
    it('2000원이 있는 상태에서 동시에 3000원 사용과 1000원 충전이 발생하면 0원이 되거나 포인트 부족 예외가 발생해야 한다.', async () => {
      const userId = 6;
      const initialAmount = 2000;
      const useAmount = 3000;
      const chargeAmount = 1000;

      await pointService.charge({ userId, amount: initialAmount });

      const usePromise = pointService.use({ userId, amount: useAmount });
      const chargePromise = pointService.charge({
        userId,
        amount: chargeAmount,
      });

      let finalPoint;
      let errorOccurred = false;

      try {
        await Promise.all([usePromise, chargePromise]);
        finalPoint = await pointService.getByUserId({ userId });
      } catch (error) {
        errorOccurred = error instanceof PointNotEnough;
        finalPoint = await pointService.getByUserId({ userId });
      }

      if (errorOccurred) {
        expect(finalPoint.remainPoint).toEqual(2000);
      } else {
        expect(finalPoint.remainPoint).toBe(0);
      }
    });
  });
});
