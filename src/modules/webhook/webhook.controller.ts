import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { QuidaxGuard } from 'src/core/guards/webhook.guard';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @UseGuards(QuidaxGuard)
  @Post('quidax')
  async quidaxWebhookEvent(
    @Body() body: any,
    @Req() req: Request,
  ): Promise<void> {
    const data = await this.webhookService.handleQuidaxWebhook(body);
  }

  @Post('vfd')
  async vbankWebhookEvent(@Body() body: any): Promise<void> {
    const data = await this.webhookService.handleQuidaxWebhook(body);
  }
}
