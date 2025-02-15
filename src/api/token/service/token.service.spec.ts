import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { TokenRepository } from '../repository/token.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TokenDomain } from '../domain/token.domain';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import {
  getAllEntities,
  getDataSource,
  setDataSource,
} from '../../../config/typeorm-factory';
import { TokenEntity, TokenStatusConst } from '../../../entity';
import * as dayjs from 'dayjs';
import { TOKEN_POLICY } from '../../../policy';
import { TokenModule } from '../token.module';
import { MyRedisModule } from '../../../redis';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { RedisModule } from '@nestjs-modules/ioredis';

describe('TokenService', () => {
  jest.setTimeout(100000);
  let module: TestingModule;
  let tokenService: TokenService;
  let tokenRepository: TokenRepository;
  let dataSource: DataSource;
  let mysqlContainer: StartedMySqlContainer;
  let redisContainer: StartedRedisContainer;

  beforeAll(async () => {
    mysqlContainer = await new MySqlContainer('mysql')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withUserPassword('test_password')
      .start();

    redisContainer = await new RedisContainer().withExposedPorts(6379).start();

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
        RedisModule.forRootAsync({
          useFactory: async () => ({
            type: 'single',
            options: {
              host: redisContainer.getHost(),
              port: redisContainer.getMappedPort(6379),
            },
          }),
        }),
        TypeOrmModule.forFeature(getAllEntities()),
        TokenModule,
        MyRedisModule,
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);
    tokenRepository = module.get<TokenRepository>(TokenRepository);
    dataSource = module.get<DataSource>(DataSource);
    setDataSource(dataSource);
  });

  beforeEach(async () => {
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

  it('유저에게 토큰을 발급한다.', async () => {
    const token = await tokenService.issue({ userId: 1 });
    expect(token).toBeDefined();
    expect(token.userId).toBe(1);
  });

  it('토큰을 ACTIVE 상태로 변경한다.', async () => {
    const newToken = await tokenRepository.save({
      domain: TokenDomain.createWaitStatus({
        userId: 2,
        nowDate: new Date(),
      }),
    });

    const allowedToken = await tokenService.allow({
      tokenValue: newToken.tokenValue(),
    });
    expect(allowedToken.status).toEqual(TokenStatusConst.ACTIVE);
  });

  it('토큰을 WAIT 상태로 변경한다', async () => {
    const newToken = await tokenRepository.save({
      domain: TokenDomain.createWaitStatus({
        userId: 3,
        nowDate: new Date(),
      }),
    });
    await tokenService.allow({ tokenValue: newToken.tokenValue() });

    const waitToken = await tokenService.wait({
      tokenValue: newToken.tokenValue(),
    });
    expect(waitToken.status).toEqual(TokenStatusConst.WAIT);
  });

  it('만료된 토큰을 삭제한다.', async () => {
    const ormTokenRepo = getDataSource().getRepository(TokenEntity);

    const nowDate = new Date();
    const 만료된_시간 = dayjs(nowDate)
      .subtract(TOKEN_POLICY.EXPIRED_TIME_SEC + 1, 'seconds')
      .toDate();
    const 만료_안된_시간 = dayjs(nowDate)
      .add(TOKEN_POLICY.EXPIRED_TIME_SEC + 1, 'seconds')
      .toDate();

    await ormTokenRepo.save(
      Array.from({ length: 30 }, (_, index) => {
        const userId = index + 1;
        const entity = new TokenEntity();
        entity.userId = userId;
        entity.issuedDate = new Date();
        entity.tokenValue = 'test-token';
        if (userId <= 15) {
          entity.expiredDate = 만료된_시간;
          entity.status = 'WAIT';
        } else {
          entity.expiredDate = 만료_안된_시간;
          entity.status = 'WAIT';
        }
        return entity;
      }),
    );
    const beforeDeleted = await ormTokenRepo.find();

    const 만료된_토큰들 = beforeDeleted.filter((e) => e.expiredDate < nowDate);
    const 만료_안된_토큰들 = beforeDeleted.filter(
      (e) => e.expiredDate < nowDate,
    );

    await tokenService.deleteExpiredToken({ nowDate });

    const result = await ormTokenRepo.find({ withDeleted: false });
    expect(만료된_토큰들.length).toEqual(15);
    expect(만료_안된_토큰들.length).toEqual(15);
    expect(result.length).toEqual(15);
  });
});
