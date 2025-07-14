export class QuidaxQueueProcessorService {}
// src/stats/product-stats-producer.service.ts
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BaseQuidaxEvent } from './quidax.utils';

@Injectable()
export class QuidaxProducerService {
  private readonly logger = new Logger(QuidaxProducerService.name);
  constructor(@InjectQueue('quidax-process') private quidaxQueue: Queue) {}

  /**
   * Adds a job to update product sales statistics after an order is created.
   * @param event The OrderCreatedEvent containing order details.
   */
  async addQuidaxApiOperation(event: BaseQuidaxEvent): Promise<void> {
    try {
      const { requestName, ...data } = event;

      await this.quidaxQueue.add(event.requestName, data, {
        attempts: 3, // Retry up to 3 times if job fails
        backoff: {
          type: 'exponential',
          delay: 1000, // 1s, 2s, 4s delays
        },
        removeOnComplete: true, // Clean up completed jobs
        removeOnFail: false, // Keep failed jobs for inspection
      });
      this.logger.log(`Added 'create-sub-account' job for Order ID`);
    } catch (error) {
      this.logger.error(
        `Failed to add 'process-order-created' job : ${error.message}`,
      );
    }
  }
}
