import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable, tap } from 'rxjs';
import { Logger } from 'winston';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const date = new Date();
    const now = date.getTime();
    const request = context.switchToHttp().getRequest();
    const [url, method] = [request.url, request.method];

    // Use Winston logger with your custom 'log' level
    this.logger.log('info', `Accessing ${method} ${url} at ${date}`);

    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(
            'info',
            `Request completed in ${Date.now() - now} ms`,
          ),
        ),
      );
  }
}
