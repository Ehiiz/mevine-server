import { Module } from '@nestjs/common';
import { UserTransferService } from './transfer.service';
import { UserTransferController } from './transfer.controller';
import { BankModule } from 'src/modules/providers/bank/bank.module';
import { BcryptService } from 'src/core/security/bcrypt.service';
import { QuidaxModule } from 'src/modules/providers/crypto/quidax/quidax.module';

@Module({
  imports: [BankModule, QuidaxModule],
  controllers: [UserTransferController],
  providers: [UserTransferService, BcryptService],
})
export class UserTransferModule {}
