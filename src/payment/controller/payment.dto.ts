import { IsDefined, IsNumber } from 'class-validator';

export class ConcertPaymentDTO {
  @IsDefined()
  @IsNumber()
  seatId: number;

  @IsDefined()
  @IsNumber()
  userId: number;
}
