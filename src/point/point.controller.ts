import { Controller, Get, Param, Post } from '@nestjs/common';

@Controller('point')
export class PointController {
  @Post('/:userId/charge')
  public async charge(@Param('userId') userId: number) {
    console.log(userId);

    return {
      chargePoint: 100,
      beforePoint: 0,
      afterPoint: 100,
    };
  }

  @Get('/:userId')
  public async info(@Param('userId') userId: number) {
    console.log(userId);

    return {
      remainPoint: 100,
    };
  }
}
