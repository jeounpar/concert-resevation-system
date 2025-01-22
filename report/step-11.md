## 동시성 테스트 보고서

### 테스트 환경
```text
Apple M1 Pro 16GB 15.0.1(24A348)
```

### 테스트코드
낙관적락 테스트코드 : [concert.service-optimistic.spec.ts](../src/api/concert/service/concert.service-optimistic.spec.ts)

비관적락 테스트코드 : [concert.service-pessimistic.spec.ts](../src/api/concert/service/concert.service-pessimistic.spec.ts)

레디스락 테스트코드 : [concert.service-redis-lock.spec.ts](../src/api/concert/service/concert.service-redis-lock.spec.ts)

### 테스트 시나리오
```text
10,000명의 유저가 동시에 같은 좌석을 예약 시도
===> 1명만 성공해야 한다.
```

### 테스트 방법
```text
npm run test:optimistic &
psrecord $(pgrep -f "npm run test:optimistic") --interval 0.01 --plot test_optimistic_usage.png

npm run test:pessimistic &
psrecord $(pgrep -f "npm run test:pessimistic") --interval 0.01 --plot test_pessimistic_usage.png

npm run test:redis-lock &
psrecord $(pgrep -f "npm run test:redis-lock") --interval 0.01 --plot test_redis-lock_usage.png
```

### 테스트 결과

#### 낙관적락 (Optimistic Lock)
```text
테스트시간 : 3812ms

최대 CPU 사용량 : 약 230%

최대 MEM 사용량 : 약 70mb
```

![test_optimistic_result.png](../img/test/test_optimistic_result.png)
![test_optimistic_usage.png](../img/test/test_optimistic_usage.png)

#### 비관적락 (Pessimistic Lock)
```text
테스트시간 : 7698ms
        
최대 CPU 사용량 : 약 180%
        
최대 MEM 사용량 : 약 68mb
```

![test_pessimistic_result.png](../img/test/test_pessimistic_result.png)
![test_pessimistic_usage.png](../img/test/test_pessimistic_usage.png)

#### 레디스락 (Redis Lock)
```text
테스트시간 : 1440ms
        
최대 CPU 사용량 : 약 170%
        
최대 MEM 사용량 : 약 70mb
```

![test_redis-lock_result.png](../img/test/test_redis-lock_result.png)
![test_redis-lock_usage.png](../img/test/test_redis-lock_usage.png)

### 테스트 결과 요약

| 테스트 종류                  | 테스트 시간(ms) | 최대 CPU 사용량 | 최대 메모리 사용량 (MB) | 구현 난이도 |
|-------------------------|------------|------------|-----------------|--------|
| 낙관적락 (Optimistic Lock)  | 3812       | 약 230%     | 약 70 MB         | 중      |
| 비관적락 (Pessimistic Lock) | 7698       | 약 180%     | 약 68 MB         | 하      |
| 레디스락 (Redis Lock)       | 1440       | 약 170%     | 약 70 MB         | 상      |


### 결론
```text
콘서트 좌석 예약 시스템에서 동시성 제어는 매우 중요한 요소입니다.
특히, 좌석 하나를 예약하는 경우 수많은 요청 중 단 하나만 성공하면 되므로,
유저 경험을 좋게하기 위해 시나리오에 적합한 락 전략을 선택해야 합니다.

비관적 락 vs 낙관적 락
비관적 락
    - 동작 방식 : 좌석을 점유한 상태에서 다른 요청을 대기 상태로 둠.
    - 특징 : 동시 요청에 대해 순차적인 처리 가능.
    - 장점 : 데이터 일관성이 매우 중요한 복잡한 비즈니스 로직에 적합. 재시도 로직 필요 X
    - 단점 : 좌석을 점유하는 동안 다른 요청이 대기 상태로 들어가기 때문에 응답 시간이 길어질 수 있음.
    
낙관적 락
    - 동작 방식 : 충돌 가능성을 허용한 상태에서 작업을 진행하고, 최종적으로 충돌 여부를 확인.
    - 특징 : 빠른 응답을 제공하여 실패 시 유저가 다른 좌석을 빠르게 시도할 수 있음.
    - 장점 : 비관적락 보다 성능적으로 우위.
    - 단점 : Rollback 또는 Retry 에 대해 고려해야함.

Redis 락
    - 동작 방식 : 비관적락과 유사한 방식으로 lock을 제어
    - 특징 : DB lock을 사용하는 것이 아닌 Redis의 기능을 이용해 lock을 제어
    - 장점 : 빠른 성능. 분산환경에서 사용 가능.
    - 단점 : DB 이외의 별도의 Redis 인프라 필요.

Redis 락은 낙관적 락에 비해 2.6배 빠른 응답을 보여주고 있고,
이를 통해 유저는 빠른 성공/실패 결과를 받아볼 수 있으며, 실패한 경우 다른 좌석을 빠르게 예매할 수 있는 기회가 생기기 때문에 
Redis Lock을 활용할 예정입니다.

```

