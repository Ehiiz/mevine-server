import { Module } from '@nestjs/common';
import { UserTransactionService } from './user-transaction.service';
import { UserTransactionController } from './user-transaction.controller';
import { TransactionModule } from 'src/modules/providers/transaction/transaction.module';

@Module({
  imports: [TransactionModule],
  controllers: [UserTransactionController],
  providers: [UserTransactionService],
})
export class UserTransactionModule {}
