// src/stats/product-stats-consumer.service.ts
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Job } from 'bullmq';
import { DatabaseService } from 'src/core/database/database.service'; // Adjust path

import {
  CreateSubAccountPayload,
  CreateWithdrawalPayload,
  DepositCompletedData,
  SubAccount,
  WalletGeneratedData,
} from '../quidax.interface';
import { QuidaxService } from '../quidax.service';
import {
  BaseQuidaxEvent,
  CreateSubAccountQuidaxEvent,
  QuidaxEventsEnum,
} from './quidax.utils';
import { BlockchainEnum } from 'src/core/interfaces/user.interface';
import { th } from '@faker-js/faker/.';

@Injectable()
@Processor('quidax-process') // This processor will handle jobs from 'product-stats' queue
export class QuidaxConsumerService extends WorkerHost {
  private readonly logger = new Logger();
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly quidaxService: QuidaxService,
  ) {
    super();
  }

  async process(job: Job<BaseQuidaxEvent, any, string>): Promise<any> {
    const event = (job.data as unknown as any).event as BaseQuidaxEvent;

    switch (event.requestName) {
      case QuidaxEventsEnum.CREATE_SUB_ACCOUNT:
        const formattedEvent = event as unknown as CreateSubAccountQuidaxEvent;
        const subAccount = await this.processSubAccountCreation(
          formattedEvent.data,
        );
        this.logger.log(`Processing job: ${job.name}`);
        break;

      case QuidaxEventsEnum.UPDATE_USER_WALLET:
        const userWalletEvent = event as unknown as WalletGeneratedData;
        await this.updateUserWallet(userWalletEvent);
        break;

      case QuidaxEventsEnum.INITIATE_TRANSFER:
        const withdrawalEvent = event as unknown as DepositCompletedData;
        await this.processWithdrawal(withdrawalEvent);
        break;
    }

    this.logger.log(`Processing function for`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<BaseQuidaxEvent, any, string>) {
    this.logger.log(`Quidax request  completed for`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BaseQuidaxEvent, any, string>, error: Error) {
    this.logger.error(
      `Failed quidax api job: ${job.name} for  ${(job.data as unknown as any).event.email}`,
      error,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job<BaseQuidaxEvent, any, string>) {
    this.logger.warn(
      `Stalled quidax api job: ${job.name} -  Event: ${(job.data as unknown as any).event.email}`,
    );
  }

  private async processSubAccountCreation(body: CreateSubAccountPayload) {
    const { id: quidaxId } = await this.quidaxService.createSubAccount(body);

    const user = await this.databaseService.users.findOne({ quidaxId });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.quidaxId = quidaxId;

    await user.save();

    const supportedCurrencies = ['usdt', 'trx', 'btc', 'eth', 'sol'];

    // Create all cryptocurrency wallets concurrently
    const walletPromises = supportedCurrencies.map((currency) =>
      this.quidaxService.createPaymentAddressForCryptocurrency(
        quidaxId,
        currency,
        {
          user_id: quidaxId,
          currency,
        },
      ),
    );

    const walletResults = await Promise.all(walletPromises);

    return;
  }

  private async updateUserWallet(addressData: WalletGeneratedData) {
    this.logger.debug(addressData);

    const currency = addressData.currency.toLowerCase() as BlockchainEnum; // Ensure lowercase and cast to enum

    // Validate if the currency is a known blockchain
    if (!Object.values(BlockchainEnum).includes(currency)) {
      this.logger.warn(
        `Received unknown currency '${currency}' from webhook. Cannot update crypto address.`,
      );
      return;
    }

    const user = await this.databaseService.users.findOne({
      quidax: addressData.user.id,
    });

    if (!user) {
      this.logger.debug('User not found');
      return;
    }

    const existingCryptoDetails = user.cryptoAddresses.get(currency);

    if (existingCryptoDetails && existingCryptoDetails.set) {
      this.logger.debug(
        `Address for ${currency} is already set for user ${user.email}. Skipping update.`,
      );
      // You might want to log this as a warning or error if it's unexpected
      return;
    }

    user.cryptoAddresses.set(currency, {
      address: addressData.address,
      set: true,
    });

    user.markModified('cryptoAddresses');

    await user.save();

    this.logger.log(
      `Handling withdrawal.address.generated event for ID: ${addressData.address}`,
    );

    return { message: 'Withdrawal address generated event processed.' };
  }

  private async processWithdrawal(depositData: DepositCompletedData) {
    this.logger.log(
      `Handling deposit.completed event for ID: ${depositData.id}`,
    );
    if (depositData.status === 'completed') {
      this.logger.log(
        `Deposit completed for user ${depositData.user_id} with amount ${depositData.amount} ${depositData.currency}`,
      );

      const withdrawalPayload: CreateWithdrawalPayload = {
        currency: depositData.currency,
        amount: depositData.amount,
        transaction_note: `Deposit completed for user ${depositData.user_id}`,
        narration: `Automated withdrawal for deposit ${depositData.id}`,
        fund_uid: 'me', // Pass if withdrawal API requires it
      };

      const user = await this.databaseService.users.findOne({
        quidaxId: depositData.user_id,
      });

      if (!user) {
        this.logger.log(`User ${depositData.user_id} not found`);
        //add notifications or push money to main account
      }

      // Ensure the amount is a string as per Quidax API requirements
      if (typeof withdrawalPayload.amount === 'number') {
        withdrawalPayload.amount =
          withdrawalPayload.amount as unknown as string;
      }

      try {
        const withdrawalResult = await this.quidaxService.createWithdrawal(
          depositData.user_id!,
          withdrawalPayload,
        );
        this.logger.log(
          'Automated withdrawal initiated successfully:',
          withdrawalResult,
        );
        return {
          message: 'Deposit completed and automated withdrawal initiated',
          withdrawal: withdrawalResult,
        };
      } catch (withdrawalError) {
        this.logger.error(
          `Failed to initiate automated withdrawal for deposit ${depositData.id}: ${withdrawalError.message}`,
          withdrawalError.stack,
        );
        throw new HttpException(
          withdrawalError.response?.data || 'Failed to initiate withdrawal',
          withdrawalError.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      this.logger.log(
        `Deposit event ${depositData.id} is not 'completed'. Status: ${depositData.status}`,
      );
    }
  }
}
