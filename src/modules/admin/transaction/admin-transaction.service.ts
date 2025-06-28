import { Injectable } from '@nestjs/common';
import mongoose from 'mongoose';
import {
  ServiceTypeEnum,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from 'src/core/interfaces/transaction.interface';
import { Transaction } from 'src/core/database/schemas/transaction.schema';
import { TransactionService } from 'src/modules/providers/transaction/transaction.service';

@Injectable()
export class AdminTransactionService {
  constructor(private readonly transactionService: TransactionService) {}

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
}
