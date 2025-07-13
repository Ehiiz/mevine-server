import { L } from '@faker-js/faker/dist/airline-BUL6NtOJ';
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
import { QuidaxService } from '../providers/crypto/quidax/quidax.service';
import { VfdWebhookPayload } from './webhook.interface';
import { DatabaseService } from 'src/core/database/database.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  constructor(
    private readonly quidaxService: QuidaxService,
    private readonly databaseService: DatabaseService,
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
          this.logger.log(
            `Handling deposit.completed event for ID: ${depositData.id}`,
          );
          if (depositData.status === 'completed') {
            this.logger.log(
              `Deposit completed for user ${depositData.user_id} with amount ${depositData.amount} ${depositData.currency}`,
            );

            // In a real application, you'd look up the user's preferred withdrawal address
            // associated with their sub_account_id or based on your application's logic.
            // For this example, we'll use a placeholder or the deposit address if available.
            const withdrawalPayload: CreateWithdrawalPayload = {
              currency: depositData.currency,
              amount: depositData.amount,
              address:
                depositData.address || 'REPLACE_WITH_ACTUAL_WITHDRAWAL_ADDRESS', // Crucial: Replace with a valid withdrawal address
              narration: `Automated withdrawal for deposit ${depositData.id}`,
              sub_account_id: depositData.user_id, // Pass if withdrawal API requires it
            };

            // Ensure the amount is a string as per Quidax API requirements
            if (typeof withdrawalPayload.amount === 'number') {
              withdrawalPayload.amount =
                withdrawalPayload.amount as unknown as string;
            }

            try {
              const withdrawalResult =
                await this.quidaxService.createWithdrawal(withdrawalPayload);
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
                withdrawalError.response?.data ||
                  'Failed to initiate withdrawal',
                withdrawalError.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }
          } else {
            this.logger.log(
              `Deposit event ${depositData.id} is not 'completed'. Status: ${depositData.status}`,
            );
          }
          break;

        case 'withdrawal.completed':
          const withdrawalData =
            webhookPayload.data as unknown as WithdrawalCompletedData;
          this.logger.log(
            `Handling withdrawal.completed event for ID: ${withdrawalData.id}`,
          );
          // Logic to update your internal records for a completed withdrawal
          // e.g., mark withdrawal as successful in your database
          this.logger.log(
            `Withdrawal ${withdrawalData.id} completed. Status: ${withdrawalData.status}, TxID: ${withdrawalData.txid}`,
          );
          return { message: 'Withdrawal completed event processed.' };

        case 'wallet.address.generated':
          this.logger.debug(webhookPayload);

          const addressData =
            webhookPayload.data as unknown as WalletGeneratedData;
          this.logger.log(
            `Handling withdrawal.address.generated event for ID: ${addressData.address}`,
          );

          return { message: 'Withdrawal address generated event processed.' };

        case 'order.filled':
          const orderData = webhookPayload.data as unknown as OrderFilledData;
          this.logger.log(
            `Handling order.filled event for ID: ${orderData.id}`,
          );
          // Logic to update your internal order status
          // e.g., mark order as filled/partially filled in your database
          this.logger.log(
            `Order ${orderData.id} filled. Market: ${orderData.market_id}, Side: ${orderData.side}, Volume: ${orderData.volume}`,
          );
          return { message: 'Order filled event processed.' };

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
