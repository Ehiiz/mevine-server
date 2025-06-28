import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { Job } from 'bullmq';
import { BaseEmailEvent } from './email.utils';

@Processor('emails')
export class EmailQueueProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<BaseEmailEvent, any, string>): Promise<any> {
    console.log(
      `Processing email job: ${job.name} for ${
        (job.data as unknown as any).event.email
      }`,
    );

    await this.emailService.sendEmail(
      (job.data as unknown as any).event as BaseEmailEvent,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<BaseEmailEvent, any, string>) {
    console.log(
      `Completed email job: ${job.name} - Event: ${(job.data as unknown as any).event.email}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BaseEmailEvent, any, string>, error: Error) {
    console.error(
      `Failed email job: ${job.name} for  ${(job.data as unknown as any).event.email}`,
      error,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job<BaseEmailEvent, any, string>) {
    console.warn(
      `Stalled email job: ${job.name} -  Event: ${(job.data as unknown as any).event.email}`,
    );
  }
}
