// src/stats/product-stats-queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QuidaxProducerService } from './quidax-producer.service';
import { QuidaxConsumerService } from './quidax-consumer.service';
import { QuidaxModule } from '../quidax.module';

@Module({
  imports: [
    QuidaxModule,
    BullModule.registerQueue({
      name: 'quidax-process', // Name of your queue for product stats
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
  providers: [QuidaxConsumerService, QuidaxProducerService],
  exports: [QuidaxProducerService], // Export the producer so other modules can add jobs
})
export class QuidaxQueueModule {}
