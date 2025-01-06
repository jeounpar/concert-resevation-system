import { Test, TestingModule } from '@nestjs/testing';
import { TokenMutatorComponent } from '../component/token-mutator.component';
import { TokenReaderComponent } from '../component/token-reader.component';
import { UserReaderComponent } from '../../user/user-reader.component';
import { getDataSource } from '../../config/typeorm-factory';
import { TokenFacade } from './token.facade';
import { TokenEntity } from '../../entity';
import { TokenDomain } from '../domain/token.domain';
import { NotFoundError } from '../../error';

jest.mock('../../config/typeorm-factory', () => ({
  getDataSource: jest.fn(),
}));

describe('TokenFacade', () => {
  let tokenFacade: TokenFacade;
  let userReader: jest.Mocked<UserReaderComponent>;
  let tokenMutator: jest.Mocked<TokenMutatorComponent>;
  let tokenReader: jest.Mocked<TokenReaderComponent>;
  let transactionMock: jest.Mock;

  beforeEach(async () => {
    transactionMock = jest.fn((cb) => cb({}));

    (getDataSource as jest.Mock).mockReturnValue({
      transaction: transactionMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenFacade,
        {
          provide: UserReaderComponent,
          useValue: { getByUserId: jest.fn() },
        },
        {
          provide: TokenMutatorComponent,
          useValue: { issue: jest.fn(), allow: jest.fn(), block: jest.fn() },
        },
        {
          provide: TokenReaderComponent,
          useValue: {
            getByToken: jest.fn(),
            getByUserId: jest.fn(),
            getByUserIdWithStatus: jest.fn(),
            getByTokenIdWithStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    tokenFacade = module.get<TokenFacade>(TokenFacade);
    userReader = module.get(UserReaderComponent);
    tokenMutator = module.get(TokenMutatorComponent);
    tokenReader = module.get(TokenReaderComponent);
  });

  describe('TokenFacade::issue()', () => {
    it('토큰이 이미 존재하면 토큰을 발급하지 않고 존재하는 토큰을 리턴한다.,', async () => {
      const tokenEntity = new TokenEntity();
      tokenEntity.id = 1;
      tokenEntity.userId = 1;
      tokenEntity.tokenId = 'existing-token';
      tokenEntity.issuedDate = new Date();
      tokenEntity.expiredDate = new Date();
      tokenEntity.status = 'ALLOW';

      const existingToken = TokenDomain.fromEntity(tokenEntity);

      jest.spyOn(existingToken, 'info').mockReturnValue({
        userId: tokenEntity.userId,
        tokenId: tokenEntity.tokenId,
        issuedDate: tokenEntity.issuedDate,
        expiredDate: tokenEntity.expiredDate,
        status: tokenEntity.status,
      });

      userReader.getByUserId.mockResolvedValue(1);
      tokenReader.getByUserId.mockResolvedValue(existingToken);

      const result = await tokenFacade.issue({ userId: 1 });

      expect(result).toEqual(existingToken.info());
    });

    it('토큰이 존재하지 않으면 새로운 토큰을 발급한다.', async () => {
      const tokenEntity = new TokenEntity();
      tokenEntity.id = 1;
      tokenEntity.userId = 1;
      tokenEntity.tokenId = 'new-token';
      tokenEntity.issuedDate = new Date();
      tokenEntity.expiredDate = new Date();
      tokenEntity.status = 'BLOCK';

      const newToken = TokenDomain.fromEntity(tokenEntity);

      jest.spyOn(newToken, 'info').mockReturnValue({
        userId: tokenEntity.userId,
        tokenId: tokenEntity.tokenId,
        issuedDate: tokenEntity.issuedDate,
        expiredDate: tokenEntity.expiredDate,
        status: tokenEntity.status,
      });

      userReader.getByUserId.mockResolvedValue(1);
      tokenReader.getByUserId.mockResolvedValue(null);
      tokenMutator.issue.mockResolvedValue(newToken);

      const result = await tokenFacade.issue({ userId: 1 });

      expect(result).toEqual(newToken.info());
    });
  });

  describe('TokenFacade::allow()', () => {
    it('토큰이 존재하지않으면 NotFoundError를 던진다.', async () => {
      tokenReader.getByToken.mockResolvedValue(null);

      await expect(
        tokenFacade.allow({ tokenId: 'invalid-token' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('BLOCK 상태의 토큰을 ALLOW 상태로 변경한다.', async () => {
      const tokenEntity = new TokenEntity();
      tokenEntity.id = 1;
      tokenEntity.userId = 1;
      tokenEntity.tokenId = 'tokenId';
      tokenEntity.issuedDate = new Date();
      tokenEntity.expiredDate = new Date();
      tokenEntity.status = 'BLOCK';

      const blockedToken = TokenDomain.fromEntity(tokenEntity);
      const allowedToken = TokenDomain.fromEntity({
        ...tokenEntity,
        status: 'ALLOW',
      });

      jest.spyOn(allowedToken, 'info').mockReturnValue({
        userId: tokenEntity.userId,
        tokenId: tokenEntity.tokenId,
        issuedDate: tokenEntity.issuedDate,
        expiredDate: tokenEntity.expiredDate,
        status: 'ALLOW',
      });

      tokenReader.getByToken.mockResolvedValue(blockedToken);
      tokenMutator.allow.mockResolvedValue(allowedToken);

      const result = await tokenFacade.allow({ tokenId: 'allow-token' });

      expect(result).toEqual(allowedToken.info());
    });
  });

  describe('TokenFacade::block()', () => {
    it('토큰이 존재하지않으면 NotFoundError를 던진다.', async () => {
      tokenReader.getByToken.mockResolvedValue(null);

      await expect(
        tokenFacade.block({ tokenId: 'invalid-token' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('ALLOW 상태의 토큰을 BLOCK 상태로 변경한다.', async () => {
      const tokenEntity = new TokenEntity();
      tokenEntity.id = 1;
      tokenEntity.userId = 1;
      tokenEntity.tokenId = 'tokenId';
      tokenEntity.issuedDate = new Date();
      tokenEntity.expiredDate = new Date();
      tokenEntity.status = 'ALLOW';

      const allowedToken = TokenDomain.fromEntity(tokenEntity);
      const blockedToken = TokenDomain.fromEntity({
        ...tokenEntity,
        status: 'BLOCK',
      });

      jest.spyOn(blockedToken, 'info').mockReturnValue({
        userId: tokenEntity.userId,
        tokenId: tokenEntity.tokenId,
        issuedDate: tokenEntity.issuedDate,
        expiredDate: tokenEntity.expiredDate,
        status: 'BLOCK',
      });

      tokenReader.getByToken.mockResolvedValue(allowedToken);
      tokenMutator.block.mockResolvedValue(blockedToken);

      const result = await tokenFacade.block({ tokenId: 'block-token' });

      expect(result).toEqual(blockedToken.info());
    });
  });
});
