import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  getHello(@Req() req: Request): any {
    return {
      data: `App is running and healthy as at ${new Date()}, Checked via ${req.ip}`,
      message: 'Succesfully got app health status',
    };
  }
}
