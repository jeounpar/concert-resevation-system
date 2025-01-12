
CREATE TABLE Concert
(
  id          INTEGER   NOT NULL,
  title       VARCHAR   NOT NULL,
  description TEXT      NULL    ,
  create_date TIMESTAMP NOT NULL,
  update_date TIMESTAMP NULL    ,
  delete_date TIMESTAMP NULL    ,
  PRIMARY KEY (id)
) COMMENT '콘서트 테이블';

CREATE TABLE ConcertSchedule
(
  id          INTEGER   NOT NULL,
  concert_id  INTEGER   NOT NULL COMMENT '콘서트 pk',
  start_time  TIME      NOT NULL COMMENT 'ex) 2024-12-01 09:00',
  end_time    TIME      NOT NULL COMMENT 'ex) 2024-12-01 11:00',
  create_date TIMESTAMP NOT NULL,
  update_date TIMESTAMP NULL    ,
  delete_date TIMESTAMP NULL    ,
  PRIMARY KEY (id)
) COMMENT '콘서트 스케쥴 테이블';

CREATE TABLE ConcertScheduleSeat
(
  id                  INTEGER   NOT NULL,
  concert_schedule_id INTEGER   NOT NULL,
  user_id             INTEGER   NOT NULL,
  seat_number         INTEGER   NULL     COMMENT '좌석 번호 (1 ~ 50)',
  status              ENUM      NULL     COMMENT 'EMPTY | RESERVED | PAID',
  price               INTEGER   NULL     COMMENT '좌석에 대한 가격',
  create_date         TIMESTAMP NOT NULL,
  expire_date         TIMESTAMP NULL    ,
  update_date         TIMESTAMP NULL    ,
  delete_date         TIMESTAMP NULL    ,
  PRIMARY KEY (id)
) COMMENT '콘서트 좌석 테이블';

CREATE TABLE Order
(
  id                       INTEGER   NOT NULL,
  user_id                  INTEGER   NOT NULL,
  concert_schedule_seat_id INTEGER   NOT NULL,
  amount                   INTEGER   NOT NULL COMMENT '총 가격',
  paid_amount              INTEGER   NULL     COMMENT '지불한 가격',
  refund_amount            INTEGER   NULL     COMMENT '환불된 가격',
  canceled_amount          INTEGER   NULL     COMMENT '취소된 가격',
  status                   ENUM      NOT NULL COMMENT 'PENDING | PAID | REFUND | CANCELED | EXPIRED',
  expire_date              TIMESTAMP NOT NULL COMMENT '주문서 만료 시간',
  paid_date                TIMESTAMP NULL     COMMENT '결제 시간',
  refund_date              TIMESTAMP NULL     COMMENT '환불 시간',
  canceled_date            TIMESTAMP NULL     COMMENT '취소한 시간',
  create_date              TIMESTAMP NOT NULL,
  update_date              TIMESTAMP NULL    ,
  delete_date              TIMESTAMP NULL    ,
  PRIMARY KEY (id)
) COMMENT '좌석에 대한 주문서 테이블';

CREATE TABLE OrderLog
(
  id          INTEGER   NOT NULL,
  order_id    INTEGER   NOT NULL,
  user_id     INTEGER   NOT NULL,
  status      ENUM      NULL     COMMENT 'PENDING | PAID | REFUND | CANCELED | EXPIRED',
  amount      INTEGER   NULL    ,
  create_date TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
) COMMENT '주문 로그 테이블';

CREATE TABLE Point
(
  id           INTEGER   NOT NULL,
  user_id      INTEGER   NOT NULL,
  remain_point INTEGER   NOT NULL,
  create_date  TIMESTAMP NOT NULL,
  update_date  TIMESTAMP NULL    ,
  PRIMARY KEY (id)
) COMMENT '포인트 테이블';

CREATE TABLE PointLog
(
  id            INTEGER   NOT NULL,
  user_id       INTEGER   NOT NULL,
  amount        INTEGER   NOT NULL,
  type          ENUM      NOT NULL COMMENT 'CHARGE | USE | REFUND',
  before_amount INTEGER   NOT NULL,
  after_amount  INTEGER   NOT NULL,
  create_date   TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
) COMMENT '포인트 로그 테이블';

CREATE TABLE Token
(
  id           VARCHAR   NOT NULL COMMENT 'UUID',
  user_id      INTEGER   NOT NULL,
  token        VARCHAR   NOT NULL COMMENT '토큰값 (uuid)',
  issued_date  TIMESTAMP NULL     COMMENT '토큰 발행 시간',
  expired_date TIMESTAMP NOT NULL COMMENT '토큰 만료 시간',
  status       ENUM      NOT NULL COMMENT 'WAIT | ACTIVE',
  PRIMARY KEY (id)
) COMMENT '토큰 테이블';

CREATE TABLE User
(
  id          INTEGER   NOT NULL,
  userId      INTEGER   NOT NULL,
  name        VARCHAR   NULL    ,
  create_date TIMESTAMP NOT NULL,
  update_date TIMESTAMP NULL    ,
  delete_date TIMESTAMP NULL    ,
  PRIMARY KEY (id)
) COMMENT '유저 테이블';

