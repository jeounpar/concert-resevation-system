import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { PointService } from '../service/point.service';
import { PointChargeDTO } from './point.dto';

@Controller('point')
export class PointController {
  constructor(private readonly pointService: PointService) {}

  @Post('/:userId/charge')
  public async charge(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: PointChargeDTO,
  ) {
    const { amount } = body;
    const result = await this.pointService.charge({ userId, amount });

    return {
      chargePoint: amount,
      userId: result.userId,
      remainPoint: result.remainPoint,
    };
  }

  @Get('/:userId')
  public async info(@Param('userId', ParseIntPipe) userId: number) {
    const result = await this.pointService.getByUserId({ userId });

    return {
      userId: result.userId,
      remainPoint: result.remainPoint,
    };
  }
}
