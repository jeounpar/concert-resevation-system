import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorageService } from '../log/async-local-storage.service';

@Injectable()
export class GenerateRequestIdMiddleware implements NestMiddleware {
  constructor(
    private readonly asyncLocalStorageService: AsyncLocalStorageService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();

    this.asyncLocalStorageService.run(
      () => {
        this.asyncLocalStorageService.set('requestId', requestId);

        next();
      },
      { requestId },
    );
  }
}
