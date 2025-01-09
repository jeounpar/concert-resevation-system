import { Body, Controller, Post } from '@nestjs/common';
import { ConcertPaymentDTO } from './payment.dto';
import { PaymentFacade } from '../service/payment.facade';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentFacade: PaymentFacade) {}

  @Post('/concert')
  async concertPayment(@Body() body: ConcertPaymentDTO) {
    const { seatId, userId } = body;

    await this.paymentFacade.concertPayment({ seatId, userId });
  }
}
