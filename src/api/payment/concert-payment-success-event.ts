import { IEvent } from '@nestjs/cqrs';

export type ConcertPaymentSuccessPayload = {
  userId: number;
  seatNumber: number;
  price: number;
  eventId: string;
};

export class ConcertPaymentSuccessEvent implements IEvent {
  constructor(public readonly payload: ConcertPaymentSuccessPayload) {}
}
