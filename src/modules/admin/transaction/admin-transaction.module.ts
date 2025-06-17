import { Module } from '@nestjs/common';
import { AdminTransactionController } from './admin-transaction.controller';
import { AdminTransactionService } from './admin-transaction.service';

@Module({
  controllers: [AdminTransactionController],
  providers: [AdminTransactionService],
})
export class AdminTransactionModule {}
