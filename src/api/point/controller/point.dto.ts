import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNumber } from 'class-validator';

export class PointChargeDTO {
  @IsDefined()
  @IsNumber()
  @ApiProperty({ example: 1000, description: '충전할 포인트' })
  amount: number;
}

export class PointChargeResponseDTO {
  @ApiProperty({ example: 1, description: '사용자 ID' })
  userId: number;

  @ApiProperty({ example: 1000, description: '충전한 포인트' })
  chargePoint: number;

  @ApiProperty({ example: 5000, description: '충전 후 남은 포인트' })
  remainPoint: number;
}

export class PointInfoResponseDTO {
  @ApiProperty({ example: 1, description: '사용자 ID' })
  userId: number;

  @ApiProperty({ example: 5000, description: '현재 남은 포인트' })
  remainPoint: number;
}
