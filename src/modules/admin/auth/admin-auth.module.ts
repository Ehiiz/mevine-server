import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { JwtModule } from '@nestjs/jwt';
import { BcryptService } from 'src/core/security/bcrypt.service';

@Module({
  imports: [JwtModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, BcryptService],
})
export class AdminAuthModule {}
