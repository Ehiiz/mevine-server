import { Module } from '@nestjs/common';
import { UserTransferService } from './transfer.service';
import { UserTransferController } from './transfer.controller';
import { BankModule } from 'src/modules/providers/bank/bank.module';
import { BcryptService } from 'src/core/security/bcrypt.service';

@Module({
  imports: [BankModule],
  controllers: [UserTransferController],
  providers: [UserTransferService, BcryptService],
})
export class UserTransferModule {}
