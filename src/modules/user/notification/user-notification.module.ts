import { Module } from '@nestjs/common';
import { UserNotificationsController } from './user-notifciation.controller';
import { UserNotificationsService } from './user-notification.service';

@Module({
  controllers: [UserNotificationsController],
  providers: [UserNotificationsService],
  exports: [UserNotificationsService],
})
export class UserNotificationsModule {}
