import { Module } from '@nestjs/common';
import { AdminTransactionController } from './admin-transaction.controller';
import { AdminTransactionService } from './admin-transaction.service';
import { TransactionModule } from 'src/modules/providers/transaction/transaction.module';
import { BankModule } from 'src/modules/providers/bank/bank.module';
import { VFDQueueModule } from 'src/modules/providers/bank/vfd/processor/vfd-queue.module';

@Module({
  imports: [TransactionModule, BankModule, VFDQueueModule],
  controllers: [AdminTransactionController],
  providers: [AdminTransactionService],
})
export class AdminTransactionModule {}
