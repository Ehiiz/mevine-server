import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BaseEmailEvent } from './email.utils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue('emails') private readonly emailQueue: Queue) {}

  async handleEmailEvent(event: BaseEmailEvent) {
    await this.emailQueue.add(event.emailType, {
      event,
      attempts: 3, // Retry up to 3 times
      backoff: {
        type: 'exponential',
        delay: 1000, // Initial delay of 1 second
      },
      removeOnComplete: true, // Remove job from queue after completion
    });
  }
}
