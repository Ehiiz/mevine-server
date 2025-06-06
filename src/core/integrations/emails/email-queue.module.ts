import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailQueueProcessor } from './email-queue.processor';
import { EmailQueueService } from './email-queue.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emails',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  providers: [EmailService, EmailQueueService, EmailQueueProcessor],
  exports: [EmailQueueService, EmailService],
})
export class EmailQueueModule {}
