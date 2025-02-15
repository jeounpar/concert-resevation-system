import { IEvent } from '@nestjs/cqrs';

export type ConcertPaymentSuccessType = {
  userId: number;
  seatNumber: number;
  price: number;
};

export class ConcertPaymentSuccessEvent implements IEvent {
  constructor(public readonly payload: ConcertPaymentSuccessType) {}
}
