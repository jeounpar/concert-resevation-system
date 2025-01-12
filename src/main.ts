import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { MyCustomLogger } from './log/my-custom-logger';
import { MyCustomExceptionFilter } from './filter/my-custom-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {});

  const logger = app.get(MyCustomLogger);
  app.useLogger(logger);

  const config = new DocumentBuilder()
    .setTitle('콘서트 예매 API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new MyCustomExceptionFilter(logger));

  await app.listen(3000);
}

bootstrap();
