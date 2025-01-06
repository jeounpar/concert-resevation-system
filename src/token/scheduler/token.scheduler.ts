import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { TOKEN_POLICY } from '../../policy';
import { TokenMutatorComponent } from '../component/token-mutator.component';
import { getDataSource } from '../../config/typeorm-factory';
import { TokenReaderComponent } from '../component/token-reader.component';

@Injectable()
export class TokenScheduler {
  constructor(
    private readonly tokenMutator: TokenMutatorComponent,
    private readonly tokenReader: TokenReaderComponent,
  ) {}

  @Interval(TOKEN_POLICY.SCHEDULE_INTERVAL)
  async tokenHandler() {
    const nowDate = new Date();

    await getDataSource().transaction(async (mgr) => {
      // 만료된 토큰 삭제
      await this.tokenMutator.deleteExpiredToken({ nowDate, mgr });

      // 최대 허용 가능한 토큰 수 확인
      const allowedTokenCount = await this.tokenReader.getAllowedTokenCount({
        mgr,
      });
      const toBeAllowedTokenCount =
        TOKEN_POLICY.ALLOWED_TOKEN_COUNT - allowedTokenCount;
      if (toBeAllowedTokenCount <= 0) return;

      // 토큰 허용
      const tokenDomains = await this.tokenReader.getBlockedTokenWithLimit({
        limit: toBeAllowedTokenCount,
        mgr,
      });
      await this.tokenMutator.allowTokens({
        domains: tokenDomains,
        mgr,
      });
    });
  }
}
