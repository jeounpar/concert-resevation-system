import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TokenFacade } from '../service/token.facade';
import { TokenIssueDTO } from './token.dto';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenFacade: TokenFacade) {}

  @Post('/issue')
  public async issueToken(@Body() body: TokenIssueDTO) {
    const token = await this.tokenFacade.issue({ userId: body.userId });

    return token;
  }

  @Get('/:tokenId/current-order')
  public async getCurrentOrder(@Param('tokenId') tokenId: string) {
    const currentOrder = await this.tokenFacade.getCurrentOrder({ tokenId });

    return {
      currentOrder,
    };
  }
}
