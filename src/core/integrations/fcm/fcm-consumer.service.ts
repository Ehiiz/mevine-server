// src/core/integrations/fcm/fcm.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FcmService } from './fcm.service';
import { BaseFcmEvent } from './fcm.utils';

@Processor('fcm') // Listens to the 'fcm' queue
export class FcmConsumerService extends WorkerHost {
  constructor(private readonly fcmService: FcmService) {
    super();
  }

  async process(job: Job<BaseFcmEvent>): Promise<any> {
    await this.fcmService.sendNotification(job.data);
  }
}
