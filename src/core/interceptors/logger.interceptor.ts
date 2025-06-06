import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    this.logger.log(`Accessing the url ${url} via a ${method} METHOD`);

    const now = Date.now();

    return next
      .handle()
      .pipe(tap(() => this.logger.log(`After.... ${Date.now() - now}ms`)));
  }
}
