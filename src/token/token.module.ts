import { Module } from '@nestjs/common';
import { TokenController } from './controller/token.controller';
import { TokenScheduler } from './scheduler/token.scheduler';
import { TokenFacade } from './service/token.facade';
import { TokenReaderComponent } from './component/token-reader.component';
import { TokenMutatorComponent } from './component/token-mutator.component';
import { UserModule } from '../user/user.module';
import { TokenRepository } from './repository/token.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from '../entity';

@Module({
  imports: [TypeOrmModule.forFeature([TokenEntity]), UserModule],
  providers: [
    TokenFacade,
    TokenReaderComponent,
    TokenMutatorComponent,
    TokenRepository,
    // TokenScheduler,
  ],
  controllers: [TokenController],
  exports: [TokenReaderComponent],
})
export class TokenModule {}
