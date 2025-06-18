import { Module } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { BcryptService } from 'src/core/security/bcrypt.service';

@Module({
  imports: [JwtModule],
  controllers: [UserAuthController],
  providers: [UserAuthService, BcryptService],
})
export class UserAuthModule {}
