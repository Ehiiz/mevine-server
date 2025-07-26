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
  GiftCardResponseDto,
  SimulateCreditDto,
} from './admin-transaction.validator';
import { VFDService } from 'src/modules/providers/bank/vfd/vfd.service';
import { CreditSimulationRequest } from 'src/modules/providers/bank/vfd/vfd.interface';
import { WinstonNestJSLogger } from 'src/core/logger/winston/winston-nestjs-logger.service';
import { DatabaseService } from 'src/core/database/database.service';

@Injectable()
export class AdminTransactionService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly vfdService: VFDService,
    private readonly logger: WinstonNestJSLogger,
    private readonly databaseService: DatabaseService,
  ) {
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
      const data = await this.transactionService.fetchAllTransactions(body);

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
      const data = await this.transactionService.fetchAllTransactions(body);

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
      const { transaction } =
        await this.transactionService.fetchATransaction(body);

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
    status: TransactionStatusEnum;
  }): Promise<{ transaction: Transaction }> {
    try {
      const transaction =
        await this.databaseService.transactions.findByIdAndUpdate(
          body.id,
          {
            status: body.status,
          },
          { new: true },
        );

      if (body.status === TransactionStatusEnum.processing) {
        // Insert vfd payment event
      } else {
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

    return {
      cardType: data.meta.paidTo.entityName,
      cardCode: cardCodeDetail!.info, // return value or null if not found
      amount: data.amount,
      user: data.user.firstName + ' ' + data.user.lastName,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      _id: data._id.toHexString(),
      status: data.status,
    };
  }
}
