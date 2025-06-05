import { ArgumentsHost, ExceptionFilter, HttpException } from '@nestjs/common';
import { MongooseError } from 'mongoose';

export class HttpExceptionFilter implements ExceptionFilter {
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

    response.status(status).json({
      statuscode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      status: 'error',
      error:
        typeof error === 'object' && error !== null ? error.message : error,
      message:
        typeof error === 'object' && error !== null ? error.message : error,
      success: false,
    });
  }
}
