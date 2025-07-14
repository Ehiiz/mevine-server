import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { BankModule } from '../providers/bank/bank.module';
import { WebhookController } from './webhook.controller';
import { QuidaxQueueModule } from '../providers/crypto/quidax/processor/quidax-queue.module';
import { FcmModule } from 'src/core/integrations/fcm/fcm.module';

@Module({
  imports: [QuidaxQueueModule, BankModule, FcmModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
