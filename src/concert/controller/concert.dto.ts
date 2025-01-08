import { IsDefined, IsNumber } from 'class-validator';

export class ReserveConcertDTO {
  @IsDefined()
  @IsNumber()
  seatId: number;

  @IsDefined()
  @IsNumber()
  userId: number;
}
