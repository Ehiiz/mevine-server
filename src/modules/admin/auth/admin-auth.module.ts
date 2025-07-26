import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { BcryptService } from 'src/core/security/bcrypt.service';

@Module({
  imports: [],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, BcryptService],
})
export class AdminAuthModule {}
