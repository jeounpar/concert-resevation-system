import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MyCustomLogger } from '../log/my-custom-logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: MyCustomLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const url = request.url;
    const body = JSON.stringify(request.body);
    const params = JSON.stringify(request.params);
    const query = JSON.stringify(request.query);
    const start = Date.now();

    this.logger.log(
      'Request',
      `method=${method}, url=${url}, body=${body}, params=${params}, query=${query}`,
    );

    return next.handle().pipe(
      tap((resBody) => {
        const elapsedMS = Date.now() - start;
        this.logger.log(
          'Response',
          `method=${method}, url=${url}, status=${response.statusCode}, elapsedMS=[${elapsedMS}ms], response=${JSON.stringify(resBody)}`,
        );
      }),
    );
  }
}
