import { IsDefined, IsNumber } from 'class-validator';

export class TokenIssueDTO {
  @IsDefined()
  @IsNumber()
  userId: number;
}
