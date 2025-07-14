import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BaseFcmEvent } from './fcm.utils';

@Injectable()
export class FcmProducerService {
  constructor(@InjectQueue('fcm') private readonly fcmQueue: Queue) {}

  public async handleFcmEvent(event: BaseFcmEvent) {
    await this.fcmQueue.add('send-fcm-notification', event, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
