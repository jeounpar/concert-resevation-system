import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { PointService } from '../service/point.service';
import {
  PointChargeDTO,
  PointChargeResponseDTO,
  PointInfoResponseDTO,
} from './point.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Point')
@Controller('point')
export class PointController {
  constructor(private readonly pointService: PointService) {}

  @Post('/:userId/charge')
  @ApiOperation({ summary: '포인트 충전' })
  @ApiResponse({
    status: 200,
    description: '포인트 충전 성공',
    type: PointChargeResponseDTO,
  })
  public async charge(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: PointChargeDTO,
  ): Promise<PointChargeResponseDTO> {
    const { amount } = body;
    const result = await this.pointService.charge({ userId, amount });

    return {
      chargePoint: amount,
      userId: result.userId,
      remainPoint: result.remainPoint,
    };
  }

  @Get('/:userId')
  @ApiOperation({ summary: '사용자 포인트 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자의 남은 포인트 조회',
    type: PointInfoResponseDTO,
  })
  public async info(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<PointInfoResponseDTO> {
    const result = await this.pointService.getByUserId({ userId });

    return {
      userId: result.userId,
      remainPoint: result.remainPoint,
    };
  }
}
