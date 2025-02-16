import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { MyCustomLogger } from '../../log/my-custom-logger';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ConcertPaymentSuccessEvent } from '../../api/payment/concert-payment-success-event';
import { ClientKafka } from '@nestjs/microservices';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { OutboxDomain } from '../../outbox/outbox.domain';

@Injectable()
export class ExternalDataPlatformEventHandler
  implements OnModuleInit, OnModuleDestroy
{
  private subscription: Subscription;

  constructor(
    private readonly eventBus: EventBus,
    private readonly outboxRepository: OutboxRepository,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly logger: MyCustomLogger,
  ) {}

  onModuleInit() {
    this.subscription = this.eventBus
      .pipe(filter((event) => event instanceof ConcertPaymentSuccessEvent))
      .subscribe((event: ConcertPaymentSuccessEvent) => {
        this.publishConcertPaymentSuccessMessage(event);
        this.messageOutboxHandler(event);
      });
  }

  onModuleDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private async messageOutboxHandler(event: ConcertPaymentSuccessEvent) {
    this.logger.log('messageOutboxHandler', 'Handling event...', event.payload);
    const outbox = OutboxDomain.createInitOutbox({ payload: event.payload });
    await this.outboxRepository.save({ domain: outbox });
  }

  private async publishConcertPaymentSuccessMessage(
    event: ConcertPaymentSuccessEvent,
  ) {
    try {
      this.logger.log(
        'handleConcertPaymentSuccess',
        'Publish Message...',
        event.payload,
      );
      this.kafkaClient.emit(
        'CONCERT_PAYMENT_RESERVATION_SUCCESS',
        event.payload,
      );
    } catch (err) {
      this.logger.error(
        'handleConcertPaymentSuccess',
        'Failed publish message',
        event.payload,
      );
    }
  }
}
