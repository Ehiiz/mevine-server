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
import { QuidaxService } from 'src/modules/providers/crypto/quidax/quidax.service';
import { TransferRequest, TransferResponseData } from '../vfd.interface';
import { VFDService } from '../vfd.service';

@Injectable()
@Processor('vfd-process') // This processor will handle jobs from 'product-stats' queue
export class VfdConsumerService extends WorkerHost {
  private readonly logger = new Logger();
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly vfdService: VFDService,
  ) {
    super();
  }

  async process(job: Job<BaseVFDEvent, any, string>): Promise<any> {
    const event = (job.data as unknown as any).event as BaseVFDEvent;

    switch (event.requestName) {
      case VFDEventsEnum.INITIATE_TRANSFER:
        const formattedEvent = event as unknown as InitiateTransferEvent;
        const transferEvent = await this.processTransfer(formattedEvent.data);
        this.logger.log(`Processing job: ${job.name}`);
        break;

      case VFDEventsEnum.SUCCESSFUL_DEPOSIT:
        const userWalletEvent = event as unknown as SuccessfulDepositEvent;
        await this.processUserDeposit(userWalletEvent.data);
        break;
    }

    this.logger.log(`Processing function for`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<BaseVFDEvent, any, string>) {
    this.logger.log(`Quidax request  completed for`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BaseVFDEvent, any, string>, error: Error) {
    this.logger.error(
      `Failed quidax api job: ${job.name} for  ${(job.data as unknown as any).event.email}`,
      error,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job<BaseVFDEvent, any, string>) {
    this.logger.warn(
      `Stalled quidax api job: ${job.name} -  Event: ${(job.data as unknown as any).event.email}`,
    );
  }

  private async processTransfer(body: TransferRequest) {
    const data = await this.vfdService.transferFunds(body);
    return;
  }

  private async processUserDeposit(addressData: TransferResponseData) {
    this.logger.debug(addressData);

    const user = await this.databaseService.users.findOne({
      'bankDetails.accountNumber': addressData.reference,
    });

    return { message: 'Withdrawal address generated event processed.' };
  }
}
