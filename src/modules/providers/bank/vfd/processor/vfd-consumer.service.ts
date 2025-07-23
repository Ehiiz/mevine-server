// src/stats/product-stats-consumer.service.ts
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DatabaseService } from 'src/core/database/database.service'; // Adjust path
import {
  BaseVFDEvent,
  InitiateTransferEvent,
  SuccessfulDepositEvent,
  VFDEventsEnum,
} from './vfd.utils';
import { TransferRequest, TransferResponseData } from '../vfd.interface';
import { VFDService } from '../vfd.service';
import { WinstonNestJSLogger } from 'src/core/logger/winston/winston-nestjs-logger.service';

@Injectable()
@Processor('vfd-process') // This processor will handle jobs from 'product-stats' queue
export class VfdConsumerService extends WorkerHost {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly vfdService: VFDService,
    private readonly logger: WinstonNestJSLogger,
  ) {
    super();
    this.logger.setContext(VfdConsumerService.name);
  }

  async process(job: Job<BaseVFDEvent, any, string>): Promise<any> {
    const event = job.data as unknown as BaseVFDEvent;
    console.log(event);
    switch (event.requestName) {
      case VFDEventsEnum.INITIATE_TRANSFER:
        this.logger.log(`Processing job: ${job.name} : ${event.requestName} `);
        const formattedEvent = event as unknown as InitiateTransferEvent;
        this.logger.log(
          `Processing job: ${job.name} for ${formattedEvent.data.reference}`,
        );
        await this.processTransfer(formattedEvent.data);
        this.logger.log(`Processing job: ${job.name}`);
        break;

      case VFDEventsEnum.SUCCESSFUL_DEPOSIT:
        const userWalletEvent = event as unknown as SuccessfulDepositEvent;
        await this.processUserDeposit(userWalletEvent.data);
        break;

      default:
        this.logger.log('Unknown event type: ' + `${event.requestName}`);
    }

    this.logger.log(`Processing function for VFD Consumer Service`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<BaseVFDEvent, any, string>) {
    this.logger.log(
      `Completed VFD api job: ${job.name} for  ${(job.data as unknown as any).email}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BaseVFDEvent, any, string>, error: Error) {
    this.logger.error(
      `Failed VFD api job: ${job.name} for  ${(job.data as unknown as any).email}`,
      error,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job<BaseVFDEvent, any, string>) {
    this.logger.warn(
      `Stalled VFD api job: ${job.name} -  Event: ${(job.data as unknown as any).email}`,
    );
  }

  private async processTransfer(body: TransferRequest) {
    try {
      this.logger.info(`Processing transfer request for `, body);
      await this.vfdService.transferFunds(body);
      return;
    } catch (error) {
      this.logger.error(`Error processing transfer request: ${error.message}`);
      throw error; // Re-throw the error to ensure the job fails
    }
  }

  private async processUserDeposit(addressData: TransferResponseData) {
    await this.databaseService.users.findOne({
      'bankDetails.accountNumber': addressData.reference,
    });

    return { message: 'Withdrawal address generated event processed.' };
  }
}
