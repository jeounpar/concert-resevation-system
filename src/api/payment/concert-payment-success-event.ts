import { EventPayload, InternalTopicConst } from '../../event';

export type ConcertPaymentSuccessType = {
  userId: number;
  seatNumber: number;
  price: number;
};

export class ConcertPaymentSuccessEvent extends EventPayload<ConcertPaymentSuccessType> {
  constructor(private readonly eventPayload: ConcertPaymentSuccessType) {
    super();
  }

  static topic() {
    return InternalTopicConst.ConcertPaymentSuccessEvent;
  }

  payload() {
    return this.eventPayload;
  }
}
