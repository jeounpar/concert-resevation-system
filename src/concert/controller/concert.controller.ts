import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ConcertService } from '../service/concert.service';
import {
  AvailableSeatsResponseDTO,
  AvailableTimesResponseDTO,
  ReserveConcertDTO,
  SeatResponseDTO,
} from './concert.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Concert')
@Controller('concert')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  @Post('/reservation')
  @ApiOperation({ summary: '콘서트 예약' })
  @ApiResponse({
    status: 200,
    description: '콘서트 예약 성공',
    type: SeatResponseDTO,
  })
  public async reserve(@Body() body: ReserveConcertDTO) {
    const { seatId, userId } = body;
    return this.concertService.reserveWithPessimisticLock({ seatId, userId });
  }

  @Get('/:concertId/available-times')
  @ApiOperation({ summary: '예약 가능한 시간 조회' })
  @ApiResponse({
    status: 200,
    description: '예약 가능한 콘서트 일정 목록 반환',
    type: AvailableTimesResponseDTO,
  })
  public async getAvailableTimes(
    @Param('concertId', ParseIntPipe) concertId: number,
  ) {
    const availableTimes = await this.concertService.getAvailableTimes({
      concertId,
    });
    return { availableTimes };
  }

  @Get('/:concertId/available-seats')
  @ApiOperation({ summary: '예약 가능한 좌석 조회' })
  @ApiQuery({
    name: 'date',
    required: true,
    description: '조회할 날짜 (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: '예약 가능한 좌석 목록 반환',
    type: AvailableSeatsResponseDTO,
  })
  public async getAvailableSeats(
    @Param('concertId', ParseIntPipe) concertId: number,
    @Query('date') theDateString: string,
  ): Promise<AvailableSeatsResponseDTO> {
    return await this.concertService.getAvailableSeats({
      concertId,
      theDateString,
    });
  }
}
