// src/dashboard/dashboard.service.ts (New File)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseService } from 'src/core/database/database.service';
import {
  TransactionStatusEnum,
  TransactionTypeEnum,
} from 'src/core/interfaces/transaction.interface';

@Injectable()
export class DashboardService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getDashboardMetrics() {
    // Total Users
    const totalUsers = await this.databaseService.users.countDocuments();
    const overallWalletSumResult = await this.databaseService.users.aggregate([
      {
        $group: {
          _id: null,
          totalWalletBalance: { $sum: '$walletBalance' }, // ASSUMPTION: 'walletBalance' field exists on User schema
        },
      },
    ]);
    const overallWalletSum =
      overallWalletSumResult.length > 0
        ? overallWalletSumResult[0].totalWalletBalance
        : 0;

    // All Time Transaction Volume (Sum of all transaction amounts)
    const allTimeTransactionVolumeResult =
      await this.databaseService.transactions.aggregate([
        {
          $group: {
            _id: null,
            totalVolume: { $sum: '$amount' },
          },
        },
      ]);
    const allTimeTransactionVolume =
      allTimeTransactionVolumeResult.length > 0
        ? allTimeTransactionVolumeResult[0].totalVolume
        : 0;

    // All Time Processed Transactions (Count of completed transactions)
    const allTimeProcessedTransactions =
      await this.databaseService.transactions.countDocuments({
        status: TransactionStatusEnum.completed,
      });

    // Total Inflow (Sum of 'funding' transactions)
    const totalInflowResult = await this.databaseService.transactions.aggregate(
      [
        {
          $match: {
            type: TransactionTypeEnum.funding,
            status: TransactionStatusEnum.completed,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ],
    );
    const totalInflow =
      totalInflowResult.length > 0 ? totalInflowResult[0].total : 0;

    // Total Outflow (Sum of 'transfer', 'withdrawal', 'charges' transactions)
    const totalOutflowResult =
      await this.databaseService.transactions.aggregate([
        {
          $match: {
            type: {
              $in: [
                TransactionTypeEnum.transfer,
                TransactionTypeEnum.withdrawal,
                TransactionTypeEnum.charges,
              ],
            },
            status: TransactionStatusEnum.completed,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);
    const totalOutflow =
      totalOutflowResult.length > 0 ? totalOutflowResult[0].total : 0;

    return {
      totalUsers,
      overallWalletSum,
      allTimeTransactionVolume,
      allTimeProcessedTransactions,
      totalInflow,
      totalOutflow,
    };
  }
}
