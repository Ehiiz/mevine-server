import { Module } from '@nestjs/common';
import { UserTransactionService } from './user-transaction.service';
import { UserTransactionController } from './user-transaction.controller';

@Module({
  controllers: [UserTransactionController],
  providers: [UserTransactionService],
})
export class UserTransactionModule {}
