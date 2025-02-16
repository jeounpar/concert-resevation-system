import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

class KafkaPublishTestDTO {
  message: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/publish')
  publishMessageTest(@Body() body: KafkaPublishTestDTO) {
    return this.appService.publishMessageTest(body.message);
  }
}
