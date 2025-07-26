import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailProducerService } from './email-producer.service';
import { EmailConsumerService } from './email-consumer.service';

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
  providers: [EmailService, EmailProducerService, EmailConsumerService],
  exports: [EmailService, EmailProducerService],
})
export class EmailQueueModule {}
