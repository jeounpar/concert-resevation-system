import { Body, Controller, Post } from '@nestjs/common';
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
}
