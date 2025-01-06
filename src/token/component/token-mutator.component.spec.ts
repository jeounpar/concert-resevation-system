import { Test, TestingModule } from '@nestjs/testing';
import { TokenMutatorComponent } from './token-mutator.component';
import { TokenRepository } from '../repository/token.repository';
import { TokenDomain } from '../domain/token.domain';
import * as dayjs from 'dayjs';
import { TOKEN_POLICY } from '../../policy';

describe('TokenMutatorComponent', () => {
  let tokenMutatorComponent: TokenMutatorComponent;
  let tokenRepository: jest.Mocked<TokenRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenMutatorComponent,
        {
          provide: TokenRepository,
          useValue: {
            save: jest.fn(),
            deleteExpired: jest.fn(),
            bulkSave: jest.fn(),
          },
        },
      ],
    }).compile();

    tokenMutatorComponent = module.get<TokenMutatorComponent>(
      TokenMutatorComponent,
    );
    tokenRepository = module.get(TokenRepository);
  });

  it('BLOCK 상태의 새로운 토큰을 발급한다.', async () => {
    const userId = 1;
    const nowDate = new Date();

    const domain = TokenDomain.createBlockStatus({ userId, nowDate });
    tokenRepository.save.mockResolvedValue(domain);

    const result = await tokenMutatorComponent.issue({
      userId,
      nowDate: new Date(),
    });

    expect(result.isBlocked()).toEqual(true);
    expect(result.info().issuedDate).toEqual(nowDate);
    expect(result.info().expiredDate).toEqual(
      dayjs(nowDate).add(TOKEN_POLICY.EXPIRED_TIME_SEC, 'seconds').toDate(),
    );
  });

  it('BLOCK 상태의 토큰을 ALLOW 상태로 변경한다.', async () => {
    const userId = 1;
    const nowDate = new Date();
    const domain = TokenDomain.createBlockStatus({ userId, nowDate });

    tokenRepository.save.mockResolvedValue(domain);

    const result = await tokenMutatorComponent.allow({ domain });

    expect(result.info().status).toBe('ALLOW');
  });

  it('ALLOW 상태의 토큰을 BLOCK 상태로 변경한다.', async () => {
    const userId = 1;
    const nowDate = new Date();
    const domain = TokenDomain.createBlockStatus({ userId, nowDate });
    domain.setAllow();

    tokenRepository.save.mockResolvedValue(domain);

    const result = await tokenMutatorComponent.block({ domain });

    expect(result.info().status).toBe('BLOCK');
  });
});
