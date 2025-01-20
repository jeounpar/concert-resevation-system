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
import { NotFoundError, TokenExpired } from '../../../error';
import { TokenModule } from '../token.module';

describe('TokenService', () => {
  jest.setTimeout(50000);
  let module: TestingModule;
  let tokenService: TokenService;
  let tokenRepository: TokenRepository;
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
        TokenModule,
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

  it('만료가 안된 토큰의 상태를 ACTIVE로 변경한다.', async () => {
    const ormTokenRepo = getDataSource().getRepository(TokenEntity);

    const totalUserCount = 30;
    const nowDate = new Date();
    const 만료_안된_시간 = dayjs(nowDate)
      .add(TOKEN_POLICY.EXPIRED_TIME_SEC + 1, 'seconds')
      .toDate();

    await ormTokenRepo.save(
      Array.from({ length: totalUserCount }, (_, index) => {
        const userId = index + 1;
        const entity = new TokenEntity();
        entity.userId = userId;
        entity.issuedDate = new Date();
        entity.tokenValue = 'test-token';
        entity.expiredDate = 만료_안된_시간;
        entity.status = 'WAIT';
        return entity;
      }),
    );

    await tokenService.activeToken({});

    const result = await ormTokenRepo.find({ withDeleted: false });
    expect(result.filter((e) => e.status === 'ACTIVE').length).toEqual(
      TOKEN_POLICY.MAX_ACTIVE_TOKEN_COUNT,
    );
    expect(result.filter((e) => e.status === 'WAIT').length).toEqual(
      totalUserCount - TOKEN_POLICY.MAX_ACTIVE_TOKEN_COUNT,
    );
  });

  it('토큰의 사용 여부를 검증한다.', async () => {
    const ormTokenRepo = getDataSource().getRepository(TokenEntity);

    const nowDate = new Date();
    const 만료_안된_시간 = dayjs(nowDate)
      .add(TOKEN_POLICY.EXPIRED_TIME_SEC + 1, 'seconds')
      .toDate();
    const 만료된_시간 = dayjs(nowDate)
      .subtract(TOKEN_POLICY.EXPIRED_TIME_SEC + 1, 'seconds')
      .toDate();

    const ACTIVE_상태의_사용가능한_토큰 = new TokenEntity();
    ACTIVE_상태의_사용가능한_토큰.userId = 1;
    ACTIVE_상태의_사용가능한_토큰.issuedDate = new Date();
    ACTIVE_상태의_사용가능한_토큰.tokenValue = 'ACTIVE_상태의_사용가능한_토큰';
    ACTIVE_상태의_사용가능한_토큰.expiredDate = 만료_안된_시간;
    ACTIVE_상태의_사용가능한_토큰.status = 'ACTIVE';

    const ACTIVE_상태의_만료된_토큰 = new TokenEntity();
    ACTIVE_상태의_만료된_토큰.userId = 2;
    ACTIVE_상태의_만료된_토큰.issuedDate = new Date();
    ACTIVE_상태의_만료된_토큰.tokenValue = 'ACTIVE_상태의_만료된_토큰';
    ACTIVE_상태의_만료된_토큰.expiredDate = 만료된_시간;
    ACTIVE_상태의_만료된_토큰.status = 'ACTIVE';

    const WAIT_상태의_만료안된_토큰 = new TokenEntity();
    WAIT_상태의_만료안된_토큰.userId = 3;
    WAIT_상태의_만료안된_토큰.issuedDate = new Date();
    WAIT_상태의_만료안된_토큰.tokenValue = 'WAIT_상태의_만료안된_토큰';
    WAIT_상태의_만료안된_토큰.expiredDate = 만료_안된_시간;
    WAIT_상태의_만료안된_토큰.status = 'WAIT';

    const WAIT_상태의_만료된_토큰 = new TokenEntity();
    WAIT_상태의_만료된_토큰.userId = 4;
    WAIT_상태의_만료된_토큰.issuedDate = new Date();
    WAIT_상태의_만료된_토큰.tokenValue = 'WAIT_상태의_만료된_토큰';
    WAIT_상태의_만료된_토큰.expiredDate = 만료된_시간;
    WAIT_상태의_만료된_토큰.status = 'WAIT';

    await ormTokenRepo.save([
      ACTIVE_상태의_사용가능한_토큰,
      ACTIVE_상태의_만료된_토큰,
      WAIT_상태의_만료안된_토큰,
      WAIT_상태의_만료된_토큰,
    ]);

    expect(() =>
      tokenService.validateToken({
        tokenValue: 'ACTIVE_상태의_사용가능한_토큰',
        nowDate,
      }),
    ).not.toThrow(TokenExpired);

    await expect(
      tokenService.validateToken({
        tokenValue: 'ACTIVE_상태의_만료된_토큰',
        nowDate,
      }),
    ).rejects.toThrow(TokenExpired);

    await expect(
      tokenService.validateToken({
        tokenValue: 'WAIT_상태의_만료안된_토큰',
        nowDate,
      }),
    ).rejects.toThrow(TokenExpired);

    await expect(
      tokenService.validateToken({
        tokenValue: 'WAIT_상태의_만료된_토큰',
        nowDate,
      }),
    ).rejects.toThrow(TokenExpired);
  });
});
