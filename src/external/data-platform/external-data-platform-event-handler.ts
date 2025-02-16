import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { MyCustomLogger } from '../../log/my-custom-logger';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ConcertPaymentSuccessEvent } from '../../api/payment/concert-payment-success-event';
import { ClientKafka } from '@nestjs/microservices';
import { getDataSource } from '../../config/typeorm-factory';
import { OutboxService } from '../../outbox';

@Injectable()
export class ExternalDataPlatformEventHandler
  implements OnModuleInit, OnModuleDestroy
{
  private subscription: Subscription;

  constructor(
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
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

    await getDataSource().transaction(async (mgr) => {
      await this.outboxService.createInitOutbox({
        payload: event.payload,
        mgr,
      });
    });
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
