import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { SKIP_TRANSFORM_METADATA } from './skip-transform.interceptor';

export class TransfomerInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const skip = Reflect.getMetadata(SKIP_TRANSFORM_METADATA, handler);

    if (skip) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        return {
          data: data.data,
          message: data.message || 'success',
          status: response.statusCode,
          success: true,
        };
      }),
    );
  }
}
