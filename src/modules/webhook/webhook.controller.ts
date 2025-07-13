import { Body, Controller, Post } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}
  @Post('quidax')
  async quidaxWebhookEvent(@Body() body: any): Promise<void> {
    const data = await this.webhookService.handleQuidaxWebhook(body);
  }

  @Post('vfd')
  async vbankWebhookEvent(@Body() body: any): Promise<void> {
    const data = await this.webhookService.handleQuidaxWebhook(body);
  }
}
