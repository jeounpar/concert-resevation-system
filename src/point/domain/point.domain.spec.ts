import { PointDomain } from './point.domain';
import { PointEntity } from '../../entity';
import { PointNotEnough } from '../../error';

describe('PointDomain', () => {
  let pointDomain: PointDomain;

  beforeEach(() => {
    const mockEntity: PointEntity = {
      id: 1,
      userId: 123,
      remainPoint: 100,
      createDate: new Date(),
      updateDate: null,
      logs: [],
    };

    pointDomain = PointDomain.fromEntity(mockEntity);
  });

  it('충분한 포인트가 있어서 포인트 사용에 문제가 없다.', () => {
    const pointLog = pointDomain.use({ amount: 50 });

    const result = pointDomain.toResponse();
    const entity = pointLog.toEntity();

    expect(result.remainPoint).toEqual(50);
    expect(entity.amount).toEqual(50);
    expect(entity.beforeAmount).toEqual(100);
    expect(entity.afterAmount).toEqual(50);
  });

  it('남아 있는 포인트보다 많은 양의 포인트를 사용하면 에러를 던진다', () => {
    expect(() => pointDomain.use({ amount: 200 })).toThrow(PointNotEnough);
  });

  it('포인트를 충전한다.', () => {
    const pointLog = pointDomain.charge({ amount: 50 });

    const result = pointDomain.toResponse();
    const entity = pointLog.toEntity();

    expect(result.remainPoint).toEqual(150);
    expect(entity.amount).toEqual(50);
    expect(entity.beforeAmount).toEqual(100);
    expect(entity.afterAmount).toEqual(150);
  });
});
