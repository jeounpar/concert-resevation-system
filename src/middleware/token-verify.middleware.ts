import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TokenReaderComponent } from '../token/component/token-reader.component';
import { TokenNotFound } from '../error';

@Injectable()
export class TokenVerifyMiddleware implements NestMiddleware {
  constructor(private readonly tokenReader: TokenReaderComponent) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tokenId = req.headers['x-queue-token'] as string;
    const nowDate = new Date();

    try {
      if (!tokenId) throw new TokenNotFound('x-queue-token header is required');

      const token = await this.tokenReader.getByToken({ tokenId });
      if (!token)
        throw new TokenNotFound('token with tokenId=${tokenId} is not found');
      token.validateToken({ nowDate });
    } catch (err) {
      res.status(400).json({
        statusCode: 400,
        message: err.message,
      });
    }

    next();
  }
}
