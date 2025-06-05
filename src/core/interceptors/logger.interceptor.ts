import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    console.log(`Accessing the url ${url} via a ${method} METHOD`);

    const now = Date.now();

    return next
      .handle()
      .pipe(tap(() => console.log(`After.... ${Date.now() - now}ms`)));
  }
}
