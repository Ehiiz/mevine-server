import { Module } from '@nestjs/common';
import { AdminTransactionController } from './admin-transaction.controller';
import { AdminTransactionService } from './admin-transaction.service';
import { TransactionModule } from 'src/modules/providers/transaction/transaction.module';

@Module({
  imports: [TransactionModule],
  controllers: [AdminTransactionController],
  providers: [AdminTransactionService],
})
export class AdminTransactionModule {}
