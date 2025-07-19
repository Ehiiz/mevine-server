import { Module } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';

import { BcryptService } from 'src/core/security/bcrypt.service';
import { QuidaxQueueModule } from 'src/modules/providers/crypto/quidax/processor/quidax-queue.module';
import { BankModule } from 'src/modules/providers/bank/bank.module';

@Module({
  imports: [QuidaxQueueModule, BankModule],
  controllers: [UserAuthController],
  providers: [UserAuthService, BcryptService],
})
export class UserAuthModule {}
