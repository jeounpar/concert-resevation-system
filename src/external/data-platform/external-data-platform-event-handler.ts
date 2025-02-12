import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { MyCustomLogger } from '../../log/my-custom-logger';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ConcertPaymentSuccessEvent } from '../../api/payment/concert-payment-success-event';

@Injectable()
export class ExternalDataPlatformEventHandler
  implements OnModuleInit, OnModuleDestroy
{
  private subscription: Subscription;

  constructor(
    private readonly eventBus: EventBus,
    private readonly logger: MyCustomLogger,
  ) {}

  onModuleInit() {
    this.subscription = this.eventBus
      .pipe(filter((event) => event instanceof ConcertPaymentSuccessEvent))
      .subscribe((event: ConcertPaymentSuccessEvent) =>
        this.handleConcertPaymentSuccess(event),
      );
  }

  onModuleDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private async handleConcertPaymentSuccess(event: ConcertPaymentSuccessEvent) {
    this.logger.log(
      'send',
      'Sending Data to External Platform...',
      event.payload,
    );
  }
}
