import { Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { TokenNotFound } from '../error';

@Controller('concert')
export class ConcertController {
  @Get('/:concertId/available-times')
  public async getAvailableTimes(
    @Param('concertId') concertId: number,
    @Headers('x-queue-token') token: string,
  ) {
    console.log(concertId, token);
    if (isNil(token)) {
      throw new TokenNotFound('token not found');
    }

    return {
      concertId: 1,
      concertName: '레미제라블',
      concertDate: [
        {
          startDate: '2024-12-01 09:00',
          endDate: '2024-12-01 11:00',
        },
        {
          startDate: '2024-12-01 12:00',
          endDate: '2024-12-01 14:00',
        },
      ],
    };
  }

  @Get('/:concertId/available-seats')
  public async getAvailableSeats(
    @Param('concertId') concertId: number,
    @Query('startDate') startDate: string,
    @Headers('x-queue-token') token: string,
  ) {
    console.log(concertId, startDate, token);
    if (isNil(token)) {
      throw new TokenNotFound('token not found');
    }

    return {
      concertId: 1,
      concertName: '레미제라블',
      startDate: '2024-12-01 09:00',
      endDate: '2024-12-01 11:00',
      availableSeats: [
        {
          seatId: 1,
          location: {
            row: 1,
            column: 1,
          },
          price: 1000,
        },
        {
          seatId: 2,
          location: {
            row: 1,
            column: 2,
          },
          price: 1000,
        },
      ],
    };
  }

  @Post('/:concertId/user/:userId/reservation')
  public async reserve(
    @Param('concertId') concertId: number,
    @Param('userId') userId: number,
    @Query('startDate') startDate: string,
    @Headers('x-queue-token') token: string,
  ) {
    console.log(concertId, userId, startDate, token);
    if (isNil(token)) {
      throw new TokenNotFound('token not found');
    }

    return {
      concertId: 1,
      concertName: '레미제라블',
      startDate: '2024-12-01 09:00',
      endDate: '2024-12-01 11:00',
      seatInfo: {
        seatId: 1,
        location: {
          row: 1,
          column: 1,
        },
        price: 1000,
      },
      orderId: 1,
      paymentUntilDate: '2024-11-30 09:05',
    };
  }
}
