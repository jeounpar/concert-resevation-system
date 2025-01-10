import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TokenService } from '../service/token.service';
import {
  CurrentOrderResponseDTO,
  TokenIssueDTO,
  TokenResponseDTO,
} from './token.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Token')
@Controller('token')
export class TokenController {
  constructor(private readonly tokenFacade: TokenService) {}

  @Post('/issue')
  @ApiOperation({ summary: '토큰 발급' })
  @ApiResponse({
    status: 200,
    description: '토큰 발급 성공',
    type: TokenResponseDTO,
  })
  public async issueToken(
    @Body() body: TokenIssueDTO,
  ): Promise<TokenResponseDTO> {
    return this.tokenFacade.issue({ userId: body.userId });
  }

  @Get('/:tokenValue/current-order')
  @ApiOperation({ summary: '현재 대기열 순서 조회' })
  @ApiResponse({
    status: 200,
    description: '현재 대기열 순서',
    type: CurrentOrderResponseDTO,
  })
  public async getCurrentOrder(
    @Param('tokenValue') tokenValue: string,
  ): Promise<CurrentOrderResponseDTO> {
    return {
      currentOrder: await this.tokenFacade.getCurrentOrder({ tokenValue }),
    };
  }
}
