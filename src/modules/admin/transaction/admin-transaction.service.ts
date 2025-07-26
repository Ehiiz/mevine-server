import { Injectable, NotFoundException } from '@nestjs/common';
import mongoose from 'mongoose';
import {
  ServiceTypeEnum,
  TransactionStatusEnum,
  TransactionTypeEnum,
  TxInfoEnum,
} from 'src/core/interfaces/transaction.interface';
import { Transaction } from 'src/core/database/schemas/transaction.schema';
import { TransactionService } from 'src/modules/providers/transaction/transaction.service';
import {
  AdminTransactionDecisionEnum,
  GiftCardResponseDto,
  SimulateCreditDto,
} from './admin-transaction.validator';
import { VFDService } from 'src/modules/providers/bank/vfd/vfd.service';
import {
  CreditSimulationRequest,
  TransferRequest,
} from 'src/modules/providers/bank/vfd/vfd.interface';
import { WinstonNestJSLogger } from 'src/core/logger/winston/winston-nestjs-logger.service';
import { DatabaseService } from 'src/core/database/database.service';
import { tr } from '@faker-js/faker/.';
import { VfdProducerService } from 'src/modules/providers/bank/vfd/processor/vfd-producer.service';
import { ConfigService } from '@nestjs/config';
import { InitiateTransferEvent } from 'src/modules/providers/bank/vfd/processor/vfd.utils';
import { createTransferSignatureWithReference } from 'src/core/utils/random-generator.util';
import { EmailProducerService } from 'src/core/integrations/emails/email-producer.service';
import {
  BaseEmailEvent,
  UserGiftCardUpdateEvent,
} from 'src/core/integrations/emails/email.utils';

@Injectable()
export class AdminTransactionService {
  private readonly platformBVN: string;
  private readonly platformClientId: string;
  private readonly platformClient: string;
  private readonly platformAccountId: string;
  private readonly platformAccountNumber: string;
  constructor(
    private readonly transactionService: TransactionService,
    private readonly vfdService: VFDService,
    private readonly logger: WinstonNestJSLogger,
    private readonly databaseService: DatabaseService,
    private readonly vfdProducerService: VfdProducerService,
    private readonly configService: ConfigService,
    private readonly emailProducerService: EmailProducerService,
  ) {
    // Initialize config values
    this.platformBVN = this.configService.get<string>('PLATFORM_BVN') || '';
    this.platformClientId =
      this.configService.get<string>('PLATFORM_CLIENT_ID') || '';
    this.platformClient =
      this.configService.get<string>('PLATFORM_CLIENT') || '';
    this.platformAccountId =
      this.configService.get<string>('PLATFORM_SAVINGS_ID') || '';
    this.platformAccountNumber =
      this.configService.get<string>('PLATFORM_ACCOUNT_NUMBER') || '';
    this.logger.setContext(AdminTransactionService.name);
  }

  async fetchAllTransactions(body: {
    page: number;
    type?: TransactionTypeEnum;
    search?: string;
    service?: ServiceTypeEnum;
    id?: mongoose.Types.ObjectId;
    limit: number;
    from?: string; // Optional: start date string (e.g., '2023-01-01')
    to?: string; // Optional: end date string (e.g., '2023-12-31')
  }): Promise<{
    currentPage: number;
    totalPages: number;
    transactions: Transaction[];
    count: number;
    sum: number;
  }> {
    try {
      const data = await this.transactionService.fetchAllTransactions({
        ...body,
        populateUser: true,
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  async fetchATransaction(body: {
    id: string;
  }): Promise<{ transaction: Transaction }> {
    try {
      const transaction = await this.transactionService.fetchATransaction(body);

      return transaction;
    } catch (error) {
      throw error;
    }
  }

  async fetchAllGiftCardTransactions(body: {
    page: number;
    type?: TransactionTypeEnum;
    search?: string;
    service: ServiceTypeEnum;
    status?: TransactionStatusEnum;
    id?: mongoose.Types.ObjectId;
    limit: number;
    from?: string; // Optional: start date string (e.g., '2023-01-01')
    to?: string; // Optional: end date string (e.g., '2023-12-31')
  }): Promise<{
    currentPage: number;
    totalPages: number;
    transactions: GiftCardResponseDto[];
    count: number;
    sum: number;
  }> {
    try {
      const data = await this.transactionService.fetchAllTransactions({
        ...body,
        populateUser: true,
      });

      return {
        ...data,
        transactions: data.transactions.map((transaction) =>
          this.formatGiftCardTransaction(transaction),
        ),
      };
    } catch (error) {
      throw error;
    }
  }

  async fetchAGiftCard(body: { id: string }): Promise<GiftCardResponseDto> {
    try {
      const { transaction } = await this.transactionService.fetchATransaction({
        ...body,
        populateUser: true,
      });
      return this.formatGiftCardTransaction(transaction);
    } catch (error) {
      throw error;
    }
  }

  async updateATransactionStatus(body: {
    id: string;
    status: TransactionStatusEnum;
  }): Promise<{ transaction: Transaction }> {
    try {
      const transaction =
        await this.transactionService.updateTransactionStatus(body);

      return transaction;
    } catch (error) {
      throw error;
    }
  }

  async updateAGiftCardTransactionStatus(body: {
    id: string;
    status: AdminTransactionDecisionEnum;
    reason?: string;
  }): Promise<{ transaction: Transaction }> {
    try {
      console.log('I got in here');
      console.log('Body:', body);
      const transaction = await this.databaseService.transactions
        .findByIdAndUpdate(
          body.id,
          {
            status:
              body.status === AdminTransactionDecisionEnum.approve
                ? TransactionStatusEnum.processing
                : TransactionStatusEnum.cancelled,
          },
          { new: true },
        )
        .populate('user');

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (body.status === AdminTransactionDecisionEnum.approve) {
        const { data: recipientDetails } =
          await this.vfdService.verifyBankDetails({
            accountNo: transaction.user.bankDetails.accountNumber,
            bank: transaction.user.bankDetails.bankCode, // Use user's bankCode
            transfer_type: 'intra', // Assuming intra-bank transfer
          });

        if (!recipientDetails) {
          throw new Error('Recipient details not found');
        }

        const { signature, reference } = createTransferSignatureWithReference({
          receiverAccount: transaction.user.bankDetails.accountNumber,
          senderAccount: this.platformAccountNumber,
        });

        const cardCodeDetail = transaction.additionalDetails.find(
          (detail) => detail.title === TxInfoEnum.giftcard_code,
        );

        const transferRequest: TransferRequest = {
          fromAccount: this.platformAccountNumber,
          fromClient: this.platformClient,
          fromClientId: this.platformClientId,
          fromSavingsId: this.platformAccountId,
          fromBvn: this.platformBVN,
          toClient: recipientDetails.name,
          toBank: recipientDetails.bank,
          toAccount: recipientDetails.account.number,
          signature: signature,
          amount: transaction.amount.toFixed(2), // Amount in Naira, formatted to 2 decimal places as string
          remark: `Giftcard Payment: ${cardCodeDetail!.info} ${transaction.meta.paidFrom.entityName} -> ${transaction.amount} NGN`,
          transferType: 'intra',
          reference: transaction.reference, // More unique reference
          toClientId: recipientDetails.clientId,
          toSavingsId: recipientDetails.account.id,
          source: true,
          ...(recipientDetails.bvn && { toBvn: recipientDetails.bvn }),
        };
        const event = new InitiateTransferEvent(
          transferRequest,
          transaction.user.email,
        );

        await this.vfdProducerService.addVfdApiOperation(event);

        const emailEvent = new UserGiftCardUpdateEvent(transaction.user.email, {
          cardType: transaction.meta.paidTo.entityName,
          status: 'approved',
        });

        await this.emailProducerService.handleEmailEvent(emailEvent);
        // Insert vfd payment event
      } else {
        const event = new UserGiftCardUpdateEvent('jaycass50@gmail.com', {
          cardType: transaction.meta.paidTo.entityName,
          status: 'cancelled',
          ...(body.reason && {
            reason: 'Transaction status updated to cancelled',
          }),
        });

        await this.emailProducerService.handleEmailEvent(event);
        // Queue email send event on alert
      }

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      return { transaction };
    } catch (error) {
      throw error;
    }
  }

  async simulateCreditAccount(body: SimulateCreditDto): Promise<{
    previousBalance: string;
    newBalance: string;
    accountNumber: string;
  }> {
    try {
      const { data: previousBalance } = await this.vfdService.getAccountBalance(
        body.accountNo,
      );
      const response = await this.vfdService.simulateVirtualWalletCredit(
        body as CreditSimulationRequest,
      );
      this.logger.info('Successfully got response', response);
      const { data: newBalance } = await this.vfdService.getAccountBalance(
        body.accountNo,
      );

      return {
        previousBalance: previousBalance!.accountBalance,
        accountNumber: body.accountNo,
        newBalance: newBalance!.accountBalance,
      };
    } catch (error) {
      throw error;
    }
  }

  private formatGiftCardTransaction(data: Transaction) {
    const cardCodeDetail = data.additionalDetails.find(
      (detail) => detail.title === TxInfoEnum.giftcard_code,
    );

    const cardCodeImage = data.additionalDetails.find(
      (detail) => detail.title === TxInfoEnum.giftcard_image,
    );

    return {
      cardType: data.meta.paidTo.entityName,
      cardImage: cardCodeImage?.info,
      cardCode: cardCodeDetail!.info, // return value or null if not found
      amount: data.amount,
      user: data.user,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      _id: data._id.toHexString(),
      status: data.status,
    };
  }
}
