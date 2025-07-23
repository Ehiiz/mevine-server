export class QuidaxQueueProcessorService {}
// src/stats/product-stats-producer.service.ts
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BaseVFDEvent } from './vfd.utils';

@Injectable()
export class VfdProducerService {
  private readonly logger = new Logger(VfdProducerService.name);
  constructor(@InjectQueue('vfd-process') private vfdQueue: Queue) {}

  /**
   * Adds a job to update product sales statistics after an order is created.
   * @param event The OrderCreatedEvent containing order details.
   */
  async addVfdApiOperation(event: BaseVFDEvent): Promise<void> {
    try {
      const { requestName, ...data } = event;

      await this.vfdQueue.add(requestName, event, {
        attempts: 3, // Retry up to 3 times if job fails
        backoff: {
          type: 'exponential',
          delay: 1000, // 1s, 2s, 4s delays
        },
        removeOnComplete: true, // Clean up completed jobs
        removeOnFail: false, // Keep failed jobs for inspection
      });
      this.logger.log(
        `Added ${event.requestName} job for ${event.email || 'unknown email'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add ${event.requestName} job : ${error.message}`,
      );
    }
  }
}
