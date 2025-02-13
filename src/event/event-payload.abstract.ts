export const InternalTopicConst = {
  ConcertPaymentSuccessEvent: 'ConcertPaymentSuccessEvent',
} as const;

export type InternalTopic = keyof typeof InternalTopicConst;

export abstract class EventPayload<T> {
  abstract payload(): T;

  // 각 이벤트 클래스에서 반드시 구현해야 하는 정적 메서드
  static topic(): InternalTopic {
    throw new Error('topic() must be implemented in subclass');
  }
}
