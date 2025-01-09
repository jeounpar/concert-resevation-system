import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ConcertService } from '../service/concert.service';
import { ReserveConcertDTO } from './concert.dto';

@Controller('concert')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  @Post('/reservation')
  public async reserve(@Body() body: ReserveConcertDTO) {
    const { seatId, userId } = body;
    const result = await this.concertService.reserve({ seatId, userId });

    return result;
  }

  @Get('/:concertId/available-times')
  public async getAvailableTimes(
    @Param('concertId', ParseIntPipe) concertId: number,
  ) {
    const result = await this.concertService.getAvailableTimes({ concertId });

    return result;
  }

  @Get('/:concertId/available-seats')
  public async getAvailableSeats(
    @Param('concertId', ParseIntPipe) concertId: number,
    @Query('date') theDateString: string,
  ) {
    const result = await this.concertService.getAvailableSeats({
      concertId,
      theDateString,
    });

    return result;
  }
}
