import { SeatEntity, SeatStatus, SeatStatusConst } from '../../entity';
import { CannotReserveError } from '../../error';
import * as dayjs from 'dayjs';
import { CONCERT_POLICY } from '../../policy';
import { SeatDomain } from './seat.domain';

const seatEntityFactory = (status: SeatStatus) => {
  const entity = new SeatEntity();

  entity.id = 1;
  entity.userId = 1;
  entity.concertScheduleId = 1;
  entity.seatNumber = 50;
  entity.status = status;
  entity.price = 1000;
  entity.createDate = new Date();
  entity.expireDate = new Date();

  return entity;
};

describe('SeatDomain', () => {
  const nowDate = new Date();

  test('비어 있는 좌석이 예약 가능한지 검증한다.', () => {
    const seatDomain = SeatDomain.fromEntity(seatEntityFactory('EMPTY'));

    expect(() => seatDomain.validateReservation()).not.toThrow();
  });

  test('예약된 좌석은 예약할 수 없다.', () => {
    const seatDomain = SeatDomain.fromEntity(seatEntityFactory('RESERVED'));
    expect(() => seatDomain.validateReservation()).toThrow(CannotReserveError);
  });

  test('결제가 완료된 좌석은 예약할 수 없다.', () => {
    const seatDomain = SeatDomain.fromEntity(seatEntityFactory('PAID'));
    expect(() => seatDomain.validateReservation()).toThrow(CannotReserveError);
  });

  test('예약 가능한 좌석에 예약을 한다.', () => {
    const seatDomain = SeatDomain.fromEntity(seatEntityFactory('EMPTY'));

    seatDomain.reserve({ nowDate, userId: 1 });
    expect(seatDomain.isReserved()).toEqual(true);
    expect(seatDomain.toResponse().expiredDate).toEqual(
      dayjs(nowDate).add(CONCERT_POLICY.EXPIRED_TIME_MIN, 'minute').toDate(),
    );
    expect(seatDomain.toResponse().status).toEqual(SeatStatusConst.RESERVED);
  });
});
