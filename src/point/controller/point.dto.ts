import { IsDefined, IsNumber } from 'class-validator';

export class PointChargeDTO {
  @IsDefined()
  @IsNumber()
  amount: number;
}
