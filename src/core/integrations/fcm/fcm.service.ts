import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { BaseFcmEvent } from './fcm.utils';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  async sendNotification(event: BaseFcmEvent) {
    const { fcmToken, title, body, data } = event;

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
            sound: 'default',
          },
        },
      },
    };

    try {
      const response = await admin.messaging().send(message);
      this.logger.log(
        `Successfully sent FCM message: ${response} to token ${fcmToken}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send FCM message to token ${fcmToken}`,
        error,
      );
      // Here you could add logic to remove invalid tokens from your database
    }
  }
}
