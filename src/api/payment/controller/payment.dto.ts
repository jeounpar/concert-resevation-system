import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNumber } from 'class-validator';
import { SeatResponseDTO } from '../../concert/controller/concert.dto';
import { PointInfoResponseDTO } from '../../point/controller/point.dto';

export class ConcertPaymentDTO {
  @IsDefined()
  @IsNumber()
  @ApiProperty({ example: 101, description: '좌석 ID' })
  seatId: number;

  @IsDefined()
  @IsNumber()
  @ApiProperty({ example: 1, description: '사용자 ID' })
  userId: number;
}

export class ConcertPaymentResponseDTO {
  @ApiProperty({ type: SeatResponseDTO, description: '좌석 결제 정보' })
  concertInfo: SeatResponseDTO;

  @ApiProperty({
    type: PointInfoResponseDTO,
    description: '결제 후 남은 포인트 정보',
  })
  pointInfo: PointInfoResponseDTO;
}
