import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { TOKEN_POLICY } from '../../policy';
import { getDataSource } from '../../config/typeorm-factory';
import { TokenService } from '../service/token.service';

@Injectable()
export class TokenScheduler {
  constructor(private readonly tokenService: TokenService) {}

  @Interval(TOKEN_POLICY.SCHEDULE_INTERVAL_DELETE_EXPIRED_TOKEN)
  async deleteExpiredToken() {
    const nowDate = new Date();

    await getDataSource().transaction(async (mgr) => {
      await this.tokenService.deleteExpiredToken({ nowDate, mgr });
    });
  }

  @Interval(TOKEN_POLICY.SCHEDULE_INTERVAL_ACTIVE_TOKEN)
  async activeToken() {
    await getDataSource().transaction(async (mgr) => {
      await this.tokenService.activeToken({ mgr });
    });
  }
}
