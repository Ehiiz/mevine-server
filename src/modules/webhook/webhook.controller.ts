import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { QuidaxGuard } from 'src/core/guards/webhook.guard';
import { Response } from 'express';
import { SkipTransform } from 'src/core/interceptors/skip-transform.interceptor';
import { ApiBody } from '@nestjs/swagger';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @UseGuards(QuidaxGuard)
  @Post('quidax')
  @SkipTransform()
  @ApiBody({
    type: 'object',
    description: 'Quidax webhook payload',
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  async quidaxWebhookEvent(@Body() body: any): Promise<void> {
    try {
      await this.webhookService.handleQuidaxWebhook(body);
      // Function returns void, NestJS will send 200 OK with no body
    } catch (error) {
      console.error('Error handling Quidax webhook:', error);
      // Let NestJS handle the error response
      throw error;
    }
  }

  @Post('vfd')
  async vbankWebhookEvent(@Body() body: any): Promise<void> {
    const data = await this.webhookService.handleQuidaxWebhook(body);
  }
}
