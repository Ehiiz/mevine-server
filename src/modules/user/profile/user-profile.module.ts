import { Module } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';

@Module({
  imports: [],

  controllers: [UserProfileController],
  providers: [UserProfileService],
})
export class UserProfileModule {}
