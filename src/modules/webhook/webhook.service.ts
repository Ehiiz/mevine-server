import {
  CreateWithdrawalPayload,
  DepositCompletedData,
  OrderFilledData,
  QuidaxWebhookEvent,
  SwapCompletedData,
  WalletGeneratedData,
  WithdrawalCompletedData,
} from '../providers/crypto/quidax/quidax.interface';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { VfdWebhookPayload } from './webhook.interface';
import { DatabaseService } from 'src/core/database/database.service';
import {
  CreateUserCreditQuidaxEvent,
  CreateWithdrawalQuidaxEvent,
  UpdateUserWalletQuidaxEvent,
} from '../providers/crypto/quidax/processor/quidax.utils';
import { QuidaxProducerService } from '../providers/crypto/quidax/processor/quidax-producer.service';
import { FcmProducerService } from 'src/core/integrations/fcm/fcm-producer.service';
import { UserTransactionInfoFcmEvent } from 'src/core/integrations/fcm/fcm.utils';
import { parse } from 'path';
import { TransactionStatusEnum } from 'src/core/interfaces/transaction.interface';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  constructor(
    private readonly quidaxProducerService: QuidaxProducerService,
    private readonly databaseService: DatabaseService,
    private readonly fcmProducerService: FcmProducerService,
  ) {}

  async handleQuidaxWebhook(webhookPayload: QuidaxWebhookEvent<any>) {
    // 'any' because data structure varies by event
    this.logger.log('Received Quidax webhook notification.', webhookPayload);

    const event = webhookPayload.event;

    try {
      switch (event) {
        case 'deposit.completed':
          const depositData =
            webhookPayload.data as unknown as DepositCompletedData;
          const depositEvent = new CreateWithdrawalQuidaxEvent(
            depositData,
            'support@mevine.ng',
          );
          await this.quidaxProducerService.addQuidaxApiOperation(depositEvent);
          return { message: 'Deposit event processed.' };

        case 'withdrawal.completed':
          const withdrawalData =
            webhookPayload.data as unknown as WithdrawalCompletedData;

          const withdrwalCompleteEvent = new CreateUserCreditQuidaxEvent(
            withdrawalData,
            withdrawalData!.user!.email!,
          );
          await this.quidaxProducerService.addQuidaxApiOperation(
            withdrwalCompleteEvent,
          );

          this.logger.log(
            `Handling withdrawal.completed event for ID: ${withdrawalData.id}`,
          );

          this.logger.log(
            `Withdrawal ${withdrawalData.id} completed. Status: ${withdrawalData.status}, TxID: ${withdrawalData.txid}`,
          );
          return { message: 'Withdrawal completed event processed.' };

        case 'wallet.address.generated':
          this.logger.debug(webhookPayload);

          const addressData =
            webhookPayload.data as unknown as WalletGeneratedData;

          const walletEvent = new UpdateUserWalletQuidaxEvent(
            addressData,
            'support@mevine.ng',
          );
          await this.quidaxProducerService.addQuidaxApiOperation(walletEvent);

          return { message: 'Withdrawal address generated event processed.' };

        case 'swap.completed':
          const swapData = webhookPayload.data as unknown as SwapCompletedData;
          this.logger.log(
            `Handling swap.completed event for ID: ${swapData.id}`,
          );
          // Logic to update your internal swap transaction status
          this.logger.log(
            `Swap ${swapData.id} completed. From: ${swapData.from_amount} ${swapData.from_currency} to ${swapData.to_amount} ${swapData.to_currency}`,
          );
          return { message: 'Swap completed event processed.' };

        // Add more cases for other Quidax webhook events as needed
        default:
          this.logger.warn(`Unhandled Quidax webhook event type: ${event}`);
          return { message: `Unhandled event type: ${event}` };
      }
    } catch (error) {
      this.logger.error(
        `Error processing Quidax webhook event '${event}': ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.response?.data || `Failed to process webhook event: ${event}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async saveWebhook(payload: VfdWebhookPayload, type: string): Promise<void> {
    try {
      const user = await this.databaseService.users.findOne({
        'bankDetails.accountNumber': payload.account_number,
      });

      if (!user) {
        this.logger.error(`User not found`);
      }

      await this.databaseService.transactions.findOneAndUpdate(
        {
          reference: payload.reference,
        },
        { status: TransactionStatusEnum.completed },
      );

      const event = new UserTransactionInfoFcmEvent(user!.fcmToken, {
        id: payload.reference,
        amount: parseInt(payload.amount),
        status: 'completed',
      });

      await this.fcmProducerService.handleFcmEvent(event);

      this.logger.log(
        `Webhook of type '${type}' saved to Firestore successfully.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save webhook to Firestore: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to save webhook: ${error.message}`);
    }
  }
}
