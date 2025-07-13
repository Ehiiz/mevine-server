import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { QuidaxModule } from '../providers/crypto/quidax/quidax.module';
import { BankModule } from '../providers/bank/bank.module';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [QuidaxModule, BankModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
