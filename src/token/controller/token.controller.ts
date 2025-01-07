import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TokenService } from '../service/token.service';
import { TokenIssueDTO } from './token.dto';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenFacade: TokenService) {}

  @Post('/issue')
  public async issueToken(@Body() body: TokenIssueDTO) {
    const token = await this.tokenFacade.issue({ userId: body.userId });

    return token;
  }

  @Get('/:tokenValue/current-order')
  public async getCurrentOrder(@Param('tokenValue') tokenValue: string) {
    const currentOrder = await this.tokenFacade.getCurrentOrder({ tokenValue });

    return {
      currentOrder,
    };
  }
}
