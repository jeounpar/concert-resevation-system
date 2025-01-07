import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TokenNotFound } from '../error';
import { TokenService } from '../token/service/token.service';

@Injectable()
export class TokenVerifyMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tokenValue = req.headers['x-queue-token'] as string;
    const nowDate = new Date();

    try {
      if (!tokenValue)
        throw new TokenNotFound('x-queue-token header is required');

      await this.tokenService.validateToken({ tokenValue, nowDate });
    } catch (err) {
      res.status(400).json({
        statusCode: 400,
        message: err.message,
      });
    }

    next();
  }
}
