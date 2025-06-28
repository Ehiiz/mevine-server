import { Module } from '@nestjs/common';
import { AdminNotificationsService } from './admin-notification.service';
import { AdminNotificationsController } from './admin-notification.controller';

@Module({
  providers: [AdminNotificationsService],
  controllers: [AdminNotificationsController],
})
export class AdminNotificationModule {}
