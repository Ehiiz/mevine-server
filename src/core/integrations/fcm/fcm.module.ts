// src/core/integrations/fcm/fcm.module.ts

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FcmQueueService } from './fcm-queue.service';
import { FcmService } from './fcm.service';
import { FcmProcessor } from './fcm.processor';

@Module({
  imports: [
    // Register the 'fcm' queue so it can be injected
    BullModule.registerQueue({
      name: 'fcm',
    }),
  ],
  // All related providers are declared here
  providers: [
    FcmService,
    FcmQueueService,
    FcmProcessor, // <-- The processor is a provider HERE
  ],
  // Export the service that other modules will need to use
  exports: [FcmQueueService],
})
export class FcmModule {}
