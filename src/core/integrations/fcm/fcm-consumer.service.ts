// src/core/integrations/fcm/fcm.processor.ts
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FcmService } from './fcm.service';
import { BaseFcmEvent } from './fcm.utils';
import { WinstonNestJSLogger } from 'src/core/logger/winston/winston-nestjs-logger.service';

@Processor('fcm') // Listens to the 'fcm' queue
export class FcmConsumerService extends WorkerHost {
  constructor(
    private readonly fcmService: FcmService,
    private readonly logger: WinstonNestJSLogger,
  ) {
    super();
    this.logger.setContext(FcmConsumerService.name);
  }

  async process(job: Job<BaseFcmEvent>): Promise<any> {
    await this.fcmService.sendNotification(job.data);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<BaseFcmEvent, any, string>) {
    this.logger.log(`Firebase request completed for ${job.name}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BaseFcmEvent, any, string>, error: Error) {
    this.logger.error(
      `Failed Firebase api job: ${job.name} for ${(job.data as unknown as any).event.email}`,
      error.stack,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job<BaseFcmEvent, any, string>) {
    this.logger.warn(
      `Stalled Firebase api job: ${job.name} - Event: ${(job.data as unknown as any).event.email}`,
    );
  }
}
