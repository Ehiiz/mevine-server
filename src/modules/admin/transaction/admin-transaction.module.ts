import { Module } from '@nestjs/common';
import { AdminTransactionController } from './admin-transaction.controller';
import { AdminTransactionService } from './admin-transaction.service';
import { TransactionModule } from 'src/modules/providers/transaction/transaction.module';
import { BankModule } from 'src/modules/providers/bank/bank.module';

@Module({
  imports: [TransactionModule, BankModule],
  controllers: [AdminTransactionController],
  providers: [AdminTransactionService],
})
export class AdminTransactionModule {}
