### 조회 API 리스트
```text
현재 대기열 순서 조회
GET /token/{tokenValue}/current-order

예약 가능한 시간 조회
GET /concert/{concertId}/available-times

예약 가능한 좌석 조회
GET /concert/{concertId}/available-seats

사용자 포인트 조회
GET /point/{userId}
```

`현재 대기열 순서 조회, 예약 가능한 좌석 조회, 사용자 포인트 조회`

해당 3개의 API는 실시간으로 데이터가 변할 가능성이 높은 데이터를 포함하고 있어서,
캐시를 적용할 경우 Cache-Hit 보다는 Cache-Miss가 더 많이 발생할 수 있다. 그러므로 해당 API들은 Cache를 적용하지 않는것이 더 좋아보인다.

다만, `좌석의 예약 가능한 시간` 같은 경우는 콘서트 예약을 받기 전에 미리 생성해두고 데이터가 변경될 일이 거의 없을거라 생각되므로
`예약 가능한 시간 조회`API에 Cache를 적용하면 DB부하를 줄이면서 성능적인 이점을 가져갈 수 있다.

### 캐시스탬피드
#### 캐시스탬피드란?
```text
다수의 클라이언트가 동일한 캐시된 데이터를 동시에 요청할 때 발생하는 문제로,
특정 데이터가 만료되면 여러 요청이 한꺼번에 서버로 전달되면서 과부하를 유발하는 현상
```

#### 원인 및 발생과정
1. 데이터 A가 캐싱된 상태로 존재
2. A가 만료된 이후 시점에 수많은 클라이언트가 해당 데이터를 조회 시도
3. A는 캐싱이 안된 상태이므로 대량의 요청이 DB 및 서버에 과부하 유발

#### 해결방안

##### Early Recompute
캐시 만료전에 미리 데이터를 갱신
```typescript
// 주기적으로 데이터 갱신
setInterval(async () => {
  const freshData = await fetchData();
  await redis.set('cache_key', freshData, 'EX', 60);
}, 55000);
```

##### Distributed Lock
동일한 데이터 대한 다중 요청이 발생한 경우 하나의 요청에 대해서만 DB를 조회하고 해당 데이터를 캐싱 후 다른 요청들은 캐시된 데이터를 리턴한다.
```typescript
class ConcertService {
  async getAvailableTimes({ concertId }: { concertId: number }) {
    const cachedData = await this.redisCache.get<AvailableTimesResponseDTO>(getCacheKey('AVAILABLE_TIMES', concertId));
    if (!isNil(cachedData)) return cachedData;
    
    # 캐싱된 데이터가 없는 경우 분산락 획득
    
    const concertSchedules = await this.concertScheduleRepository
      .findMany()
      .concertId({ concertId });

    if (concertSchedules.length === 0) return [];

    const result = concertSchedules.map((e) => e.toResponse());
    await this.redisCache.set(
      getCacheKey('AVAILABLE_TIMES', concertId),
      result,
    );
    
    # 분산락 해제
    return result;
  }
}
```

##### Randomized TTL
동일한 시간에 캐시가 만료되는 것을 방지하기 위해, 랜덤한 TTL 값을 추가
```typescript
const ttl = 60 + Math.floor(Math.random() * 10);
```


