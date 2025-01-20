import { Module } from '@nestjs/common';
import { TokenController } from './controller/token.controller';
import { TokenService } from './service/token.service';
import { TokenRepository } from './repository/token.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from '../../entity';
import { TokenScheduler } from './controller/token.scheduler';
import { LogModule } from '../../log/log.module';

@Module({
  imports: [TypeOrmModule.forFeature([TokenEntity]), LogModule],
  providers: [TokenService, TokenRepository, TokenScheduler],
  controllers: [TokenController],
  exports: [TokenService],
})
export class TokenModule {}
