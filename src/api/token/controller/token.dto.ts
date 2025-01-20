import { IsDefined, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TokenIssueDTO {
  @ApiProperty({ example: 1, description: '사용자 ID' })
  @IsDefined()
  @IsNumber()
  userId: number;
}

export class TokenResponseDTO {
  @ApiProperty({ example: 1, description: '사용자 ID' })
  userId: number;

  @ApiProperty({
    example: '3935f65c-688a-40bc-b86d-450c3669fea0',
    description: '발급된 토큰 값',
  })
  tokenValue: string;

  @ApiProperty({
    example: '2025-01-09T06:22:42.000Z',
    description: '토큰 발급 시간',
  })
  issuedDate: Date;

  @ApiProperty({
    example: '2025-01-09T06:32:42.000Z',
    description: '토큰 만료 시간',
  })
  expiredDate: Date;

  @ApiProperty({
    example: 'WAIT',
    description: '토큰 상태',
  })
  status: string;
}

export class CurrentOrderResponseDTO {
  @ApiProperty({
    example: 100,
    description: '현재 대기열 순서',
  })
  currentOrder: number;
}
