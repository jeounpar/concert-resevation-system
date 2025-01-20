import { TokenDomain } from './token.domain';
import * as dayjs from 'dayjs';
import { TOKEN_POLICY } from '../../../policy';
import { TokenExpired } from '../../../error';

describe('TokenDomain', () => {
  it('WAIT 상태를 가진 TokenDomain을 생성 후 발급시간 및 만료시간을 검증한다.', () => {
    const userId = 1;
    const nowDate = new Date();
    const domain = TokenDomain.createWaitStatus({ userId, nowDate });

    const info = domain.info();

    expect(info.userId).toEqual(userId);
    expect(info.expiredDate).toEqual(
      dayjs(nowDate).add(TOKEN_POLICY.EXPIRED_TIME_SEC, 'seconds').toDate(),
    );

    expect(domain.isWait()).toEqual(true);
  });

  it('WAIT 상태를 가진 TokenDomain을 생성 후 ACTIVE 상태로 변경한다', () => {
    const nowDate = new Date();
    const domain = TokenDomain.createWaitStatus({ userId: 1, nowDate });

    domain.setActive();

    expect(domain.isActive()).toEqual(true);
  });

  it('ACTIVE 상태를 가진 TokenDomain을 WAIT 상태로 변경한다', () => {
    const nowDate = new Date();
    const domain = TokenDomain.createWaitStatus({ userId: 1, nowDate });
    domain.setActive();

    domain.setWait();

    expect(domain.isWait()).toEqual(true);
  });

  it('만료시간이 지난 토큰은 `ACTIVE 상태`여도 사용할 수 없다.', () => {
    const nowDate = new Date();
    const 만료시간_지났음 = dayjs(nowDate)
      .subtract(TOKEN_POLICY.EXPIRED_TIME_SEC + 1, 'seconds')
      .toDate();

    const domain = TokenDomain.createWaitStatus({
      userId: 1,
      nowDate: 만료시간_지났음,
    });
    domain.setActive();

    expect(domain.isActive()).toEqual(true);
    expect(domain.isExpired({ nowDate })).toEqual(true);
    expect(() => {
      domain.validateToken({ nowDate });
    }).toThrow(TokenExpired);
  });
});
