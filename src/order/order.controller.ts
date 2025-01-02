import { Controller, Param, Post } from '@nestjs/common';

@Controller('order')
export class OrderController {
  @Post('/:concertId/user/:userId/reservation')
  public async reserve(@Param('userId') userId: number) {
    console.log(userId);

    return {
      concertInfo: {
        concertId: 1,
        concertName: '레미제라블',
        startDate: '2024-12-01 09:00',
        endDate: '2024-12-01 11:00',
      },
      seatInfo: {
        seatId: 1,
        location: {
          row: 1,
          column: 1,
        },
        price: 1000,
      },
      orderInfo: {
        orderId: 1,
        totalAmount: 1000,
        paidAmount: 1000,
        orderDate: '2024-11-30 09:00',
        paymentDate: '2024-11-30 09:03',
      },
      pointInfo: {
        remainPoint: 0,
      },
    };
  }
}
