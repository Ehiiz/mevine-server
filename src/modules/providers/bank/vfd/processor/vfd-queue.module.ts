import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BankModule } from '../../bank.module';
import { VfdConsumerService } from './vfd-consumer.service';
import { VfdProducerService } from './vfd-producer.service';
import { VFDService } from '../vfd.service';

@Module({
  imports: [
    BankModule,
    BullModule.registerQueue({
      name: 'vfd-process', // Name of your queue for product stats
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
  providers: [VfdConsumerService, VfdProducerService, VFDService],
  exports: [VfdProducerService, VFDService], // Export the producer so other modules can add jobs
})
export class VFDQueueModule {}
