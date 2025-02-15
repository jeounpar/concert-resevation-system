### 테스트 데이터 마이그레이션 코드

```typescript
// 토큰 데이터
(async () => {
  await NestFactory.create(AppModule, {});

  const dataSource = getDataSource();

  const repo = dataSource.getRepository(TokenEntity);

  const date = new Date();
  for (let i = 1; i <= 1_000_000; i++) {
    await repo.insert({
      userId: i,
      tokenValue: v4(),
      issuedDate: date,
      expiredDate: date,
      status: 'WAIT',
    });
  }

  process.exit(0);
})();
```

```typescript
// 콘서트 스케쥴 데이터
(async () => {
  await NestFactory.create(AppModule, {});

  const dataSource = getDataSource();

  const repo = dataSource.getRepository(ConcertScheduleEntity);

  for (let i = 1; i <= 1_000_000; i++) {
    const concertId = (i % 1000) + 1;
    await repo.insert({
      concertId: concertId,
      theDateString: '2024-' + i + '-' + concertId,
    });
  }

  process.exit(0);
})();
```

### 서비스에서 사용하고 있는 조회 쿼리
#### TokenRepository
```typescript
const token = await this.tokenRepository
  .findOne()
  .tokenValue({ tokenValue });

const existToken = await this.tokenRepository
  .findOne(mgr)
  .userId({ userId });
```

userId, tokenValue 조회 쿼리를 많이하므로 각각에 index 추가
```typescript
export class TokenEntity {
  ...
  @Index('token_entity_user_id')
  @Column({ type: 'int' })
  userId: number;

  @Index('token_entity_token_value')
  @Column({ type: 'varchar' })
  tokenValue: string;
 ...
}
```

**TokenEntity 100만개 데이터로 테스트**

![01.png](../img/step-15/01.png)
![01-1.png](../img/step-15/01-1.png)

### userId에 Index 적용 전

쿼리
```sql
EXPLAIN ANALYZE
SELECT *
FROM hhplus_token_entity 
WHERE user_id = 578291 
```

결과
```text
-> Filter: (hhplus_token_entity.user_id = 578291)  (cost=101003 rows=96040) (actual time=239..366 rows=1 loops=1)
    -> Table scan on hhplus_token_entity  (cost=101003 rows=960395) (actual time=0.0757..339 rows=1e+6 loops=1)=
```

쿼리 실행 시간 : 336ms

### userId에 Index 적용 후

쿼리
```sql
EXPLAIN ANALYZE
SELECT *
FROM hhplus_token_entity 
WHERE user_id = 578291 
```

결과
```text
-> Index lookup on hhplus_token_entity using token_entity_user_id (user_id = 578291)  (cost=0.746 rows=1) (actual time=0.0621..0.0638 rows=1 loops=1)
```

쿼리 실행 시간 : 0.0017 ms 


#### 결과 정리

|           | 인덱스 적용 전        | 인덱스 적용 후               |
|-----------|-----------------|------------------------|
| 비용        | 101003          | 0.746                  |
| 예상 반환 행 수 | 96040           | 1                      |
| 실제 실행 시간	 | 366 ms (0.366초) | 0.0638 ms (0.000064초)  |
| 쿼리 방식     | Full Table Scan | 	Index Lookup (B-Tree) | 

- 실행 시간이 366ms → 0.0638ms (약 5,700배 향상)
- 비용이 101,003 → 0.746로 대폭 감소
- 불필요한 행 스캔 없이 즉시 user_id = 578291 값을 찾아서 반환




### concertScheduleRepository
```typescript
const concertSchedules = await this.concertScheduleRepository
  .findMany()
  .concertId({ concertId });

const concertSchedule = await this.concertScheduleRepository
  .findOne()
  .concertIdAndTheDate({ concertId, theDateString });
```

concertId, (concertId, theDateString) 조회 쿼리를 많이하므로 각각에 index 추가
```typescript
@Entity()
@Index('concert_schedule_index', ['concertId', 'theDateString'])
export class ConcertScheduleEntity {
  ...
  @Index('concert_schedule_concert_id')
  @Column({ type: 'int' })
  concertId: number;

  @Column({ type: 'varchar' })
  theDateString: string;
  ...
}
```

100만건 데이터에 대해 테스트

![04.png](../img/step-15/04.png)
![05.png](../img/step-15/05.png)

### (concertId, theDateString) 복합 Index 적용 전

쿼리
```sql
EXPLAIN ANALYZE
SELECT *
FROM hhplus_concert_schedule_entity 
WHERE concert_id = 967 and the_date_string = "2024-500966-967"
```

결과
```text
-> Filter: (hhplus_concert_schedule_entity.the_date_string = '2024-500966-967')  (cost=627 rows=100) (actual time=4.93..81.4 rows=1 loops=1)
    -> Index lookup on hhplus_concert_schedule_entity using concert_schedule_concert_id (concert_id = 967)  (cost=627 rows=1000) (actual time=0.558..81.1 rows=1000 loops=1)
```



### (concertId, theDateString) 복합 Index 적용 후

쿼리
```sql
EXPLAIN ANALYZE
SELECT *
FROM hhplus_concert_schedule_entity 
WHERE concert_id = 967 and the_date_string = "2024-500966-967"
```

결과
```text
-> Index lookup on hhplus_concert_schedule_entity using concert_schedule_index (concert_id = 967, the_date_string = '2024-500966-967')  (cost=0.717 rows=1) (actual time=0.262..0.265 rows=1 loops=1)
```


#### 결과 정리

|           | 인덱스 적용 전              | 인덱스 적용 후             |
|-----------|-----------------------|----------------------|
| 비용        | 627                   | 0.717                |
| 예상 반환 행 수 | 100                   | 1                    |
| 실제 실행 시간	 | 81.4 ms (0.0814초)     | 0.265 ms (0.000265초) |
| 쿼리 방식     | Index Lookup 후 추가 필터링 | 	Index Lookup        | 

- 실행 시간이 81.4ms → 0.265ms (약 307배 향상)
- 비용이 627 → 1로 감소



