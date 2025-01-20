import { Body, Controller, Post } from '@nestjs/common';
import { ConcertPaymentDTO, ConcertPaymentResponseDTO } from './payment.dto';
import { PaymentFacade } from '../service/payment.facade';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentFacade: PaymentFacade) {}

  @Post('/concert')
  @ApiOperation({ summary: '예약한 콘서트 결제' })
  @ApiResponse({
    status: 200,
    description: '콘서트 결제 성공',
    type: ConcertPaymentResponseDTO,
  })
  public async concertPayment(@Body() body: ConcertPaymentDTO) {
    const { seatId, userId } = body;

    return await this.paymentFacade.concertPayment({
      seatId,
      userId,
    });
  }
}
