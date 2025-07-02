import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
  Logger,
} from '@nestjs/common';
import { MongooseError } from 'mongoose';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let error: any = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = exception.getResponse();
    } else if (exception instanceof MongooseError) {
      error = exception.message;
      status = 403;
    } else if (exception instanceof Error) {
      error = exception.message;
      status = 400;
    }

    // This is the crucial part: log the unhandled exception as 'fatal'
    this.logger.error(`Unhandled Exception: ${exception}`, {
      stack: exception instanceof Error ? exception.stack : '',
      path: request.url,
      method: request.method,
      ip: request.ip,
      body: request.body,
    });
    response.status(status).json({
      statuscode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      status: status,
      error:
        typeof error === 'object' && error !== null ? error.message : error,
      message:
        typeof error === 'object' && error !== null ? error.message : error,
      success: false,
    });
  }
}
