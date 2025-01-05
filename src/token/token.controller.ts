import { Controller, Get, Param } from '@nestjs/common';

@Controller('token')
export class TokenController {
  constructor() {}

  @Get('/:userId')
  public async getToken(@Param('userId') userId: number) {
    console.log(userId);
    return {
      token: '155b6bfa-d542-4001-8a70-c86adde969af',
    };
  }
}
