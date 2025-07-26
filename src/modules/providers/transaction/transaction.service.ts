import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ServiceTypeEnum,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from 'src/core/interfaces/transaction.interface';
import mongoose from 'mongoose';
import { Transaction } from 'src/core/database/schemas/transaction.schema';
import { DatabaseService } from 'src/core/database/database.service';

@Injectable()
export class TransactionService {
  constructor(private readonly databaseService: DatabaseService) {}

  async fetchAllTransactions(body: {
    page: number;
    type?: TransactionTypeEnum;
    search?: string;
    service?: ServiceTypeEnum;
    status?: TransactionStatusEnum;
    id?: mongoose.Types.ObjectId;
    limit: number;
    from?: string; // Optional: start date string (e.g., '2023-01-01')
    to?: string; // Optional: end date string (e.g., '2023-12-31')
    populateUser?: boolean;
  }): Promise<{
    currentPage: number;
    totalPages: number;
    transactions: Transaction[];
    count: number;
    sum: number;
  }> {
    try {
      const query: any = {};
      const skip = (body.page - 1) * body.limit;

      if (body.search) {
        const searchRegex = { $regex: body.search, $options: 'i' };
        query.$or = [
          { 'meta.paidFrom.entityId': searchRegex },
          {
            'meta.paidFrom.entityCode': searchRegex,
          },
          {
            'meta.paidFrom.entityNumber': searchRegex,
          },
          {
            'meta.paidFrom.entityName': searchRegex,
          },
          { 'meta.paidTo.entityId': searchRegex },
          {
            'meta.paidTo.entityCode': searchRegex,
          },
          {
            'meta.paidTo.entityNumber': searchRegex,
          },
          {
            'meta.paidTo.entityName': searchRegex,
          },
        ];
      }

      if (body.from || body.to) {
        query.createdAt = {};
        if (body.from) {
          const fromDate = new Date(body.from);
          if (isNaN(fromDate.getTime())) {
            throw new BadRequestException('Invalid "from" date format.');
          }
          query.createdAt.$gte = fromDate;
        }
        if (body.to) {
          const toDate = new Date(body.to);
          if (isNaN(toDate.getTime())) {
            throw new BadRequestException('Invalid "to" date format.');
          }
          toDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = toDate;
        }
      }

      if (body.service) {
        query.service = body.service;
      }

      if (body.status) {
        query.status = body.status;
      }

      if (body.type) {
        query.type = body.type;
      }

      if (body.id) {
        query.user = body.id;
      }

      // Build the transaction query with conditional population
      let transactionQuery = this.databaseService.transactions
        .find(query)
        .skip(skip)
        .limit(body.limit);

      // Conditionally populate user based on populateUser flag
      if (body.populateUser === true) {
        transactionQuery = transactionQuery.populate(
          'user',
          'firstName lastName email',
        );
      }

      const [transactions, countResult, sumResult] = await Promise.all([
        transactionQuery.exec(),
        this.databaseService.transactions.countDocuments(query),
        this.databaseService.transactions
          .aggregate([
            { $match: query }, // Filter transactions based on the same query
            {
              $group: {
                _id: null, // Group all matching documents into a single group
                totalAmount: { $sum: '$amount' }, // Sum the 'amount' field
              },
            },
          ])
          .exec(),
      ]);

      const totalSum = sumResult.length > 0 ? sumResult[0].totalAmount : 0; // Extract the sum

      return {
        currentPage: body.page,
        totalPages: Math.ceil(countResult / body.limit), // Use Math.ceil for correct total pages
        transactions,
        count: countResult,
        sum: totalSum,
      };
    } catch (error) {
      throw error;
    }
  }

  async fetchATransaction(body: {
    id: string;
    populateUser?: boolean; // <-- New optional property
  }): Promise<{ transaction: Transaction }> {
    try {
      let query = this.databaseService.transactions.findById(body.id);

      // Conditionally apply populate based on the populateUser flag
      if (body.populateUser) {
        query = query.populate('user', 'firstName lastName email');
      }

      const transaction = await query.exec(); // Execute the query

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      return { transaction };
    } catch (error) {
      throw error;
    }
  }

  async updateTransactionStatus(body: {
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

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      return { transaction };
    } catch (error) {
      throw error;
    }
  }
}
