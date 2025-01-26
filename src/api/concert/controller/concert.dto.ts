import { IsDefined, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SeatInfo } from '../domain/seat.domain';
import { SeatStatus } from '../../../entity';

export class ReserveConcertDTO {
  @IsDefined()
  @IsNumber()
  @ApiProperty({ example: 1, description: '예약할 좌석 ID' })
  seatId: number;

  @IsDefined()
  @IsNumber()
  @ApiProperty({ example: 1, description: '사용자 ID' })
  userId: number;
}

class SeatInfoDTO implements SeatInfo {
  @ApiProperty({ example: 3, description: '좌석 ID' })
  seatId: number;

  @ApiProperty({ example: 3, description: '좌석 번호' })
  seatNumber: number;

  @ApiProperty({
    example: 'EMPTY',
    description: '좌석 상태 (EMPTY / RESERVED / PAID)',
  })
  status: SeatStatus;

  @ApiProperty({ example: 1000, description: '좌석 가격' })
  price: number;
}

class ConcertScheduleDTO {
  @ApiProperty({ example: 1, description: '콘서트 일정 ID' })
  concertScheduleId: number;

  @ApiProperty({ example: 1, description: '콘서트 ID' })
  concertId: number;

  @ApiProperty({ example: '2024-12-01', description: '콘서트 날짜' })
  theDateString: string;

  @ApiProperty({ type: [SeatInfoDTO], description: '좌석 정보 목록' })
  seatInfo: SeatInfoDTO[];
}

export class AvailableTimesResponseDTO {
  @ApiProperty({
    type: [ConcertScheduleDTO],
    description: '예약 가능한 콘서트 일정 목록',
  })
  availableTimes: ConcertScheduleDTO[];
}

export class AvailableSeatsResponseDTO {
  @ApiProperty({ example: 1, description: '콘서트 ID' })
  concertId: number;

  @ApiProperty({ example: '2024-12-01', description: '조회한 날짜' })
  theDateString: string;

  @ApiProperty({
    type: [SeatInfoDTO],
    example: [
      {
        seatNumber: 1,
        status: 'EMPTY',
        expiredDate: null,
        price: 1000,
      },
    ],
  })
  seatInfo: SeatInfoDTO[];
}

export class SeatResponseDTO {
  @ApiProperty({ example: 1, description: '사용자 ID' })
  userId: number;

  @ApiProperty({ example: 5, description: '좌석 번호' })
  seatNumber: number;

  @ApiProperty({
    example: 'RESERVED',
    description: '좌석 상태 (EMPTY / RESERVED / PAID)',
  })
  status: SeatStatus;

  @ApiProperty({
    example: '2024-12-31T23:59:59',
    description: '예약 만료 시간',
  })
  expiredDate: Date;

  @ApiProperty({ example: 1000, description: '좌석 가격' })
  price: number;
}
