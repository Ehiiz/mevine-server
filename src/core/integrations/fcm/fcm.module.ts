// src/core/integrations/fcm/fcm.module.ts

import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FcmService } from './fcm.service';
import { FcmProducerService } from './fcm-producer.service';
import { FcmConsumerService } from './fcm-consumer.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'fcm',
    }),
  ],
  providers: [FcmService, FcmConsumerService, FcmProducerService],
  exports: [FcmProducerService],
})
export class FcmModule {}
