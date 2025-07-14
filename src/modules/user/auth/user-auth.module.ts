import { Module } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';

import { BcryptService } from 'src/core/security/bcrypt.service';
import { QuidaxQueueModule } from 'src/modules/providers/crypto/quidax/processor/quidax-queue.module';

@Module({
  imports: [QuidaxQueueModule],
  controllers: [UserAuthController],
  providers: [UserAuthService, BcryptService],
})
export class UserAuthModule {}
