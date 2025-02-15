import { Injectable } from '@nestjs/common';
import { MyCustomLogger } from '../../log/my-custom-logger';
import { OnEvent } from '@nestjs/event-emitter';
import { ConcertPaymentSuccessEvent } from '../../api/payment/concert-payment-success-event';

@Injectable()
export class ExternalDataPlatformListener {
  constructor(private readonly logger: MyCustomLogger) {}

  @OnEvent(ConcertPaymentSuccessEvent.topic(), { async: true })
  async handleConcertPaymentSuccessEvent(
    eventPayload: ConcertPaymentSuccessEvent,
  ) {
    this.logger.log(
      'send',
      'Sending Data to External Platform...',
      eventPayload.payload(),
    );
  }
}
