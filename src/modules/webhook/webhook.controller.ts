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

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @UseGuards(QuidaxGuard)
  @Post('quidax')
  async quidaxWebhookEvent(
    @Body() body: any,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.webhookService.handleQuidaxWebhook(body);

      res.status(HttpStatus.OK).json({
        message: 'Webhook event received and processed successfully.',
      });
    } catch (error) {
      console.error('Error handling Quidax webhook:', error);
    }
  }

  @Post('vfd')
  async vbankWebhookEvent(@Body() body: any): Promise<void> {
    const data = await this.webhookService.handleQuidaxWebhook(body);
  }
}
