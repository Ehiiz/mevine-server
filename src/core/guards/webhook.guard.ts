import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto'; // Import the crypto module
import { EmailQueueService } from '../integrations/emails/email-queue.service';
import { AdminPushNotificationEvent } from '../integrations/emails/email.utils';

@Injectable()
export class QuidaxGuard implements CanActivate {
  private readonly quidaxWebhookKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailQueueService: EmailQueueService,
  ) {
    // It's better to get the key in the constructor if it's static
    const key = this.configService.get<string>('QUIDAX_WEBHOOK_KEY');
    if (!key) {
      throw new Error('QUIDAX_WEBHOOK_KEY is not defined in configuration.');
    }
    this.quidaxWebhookKey = key;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const event = new AdminPushNotificationEvent(
        this.configService,
        {
          title: 'Quidax Webhook',
          body: 'Recieved webhook',
          sentByAdminId: 'Quidax',
        },
        'jaycass50@gmail.com',
      );
      await this.emailQueueService.handleEmailEvent(event);
      const req: Request = context.switchToHttp().getRequest();

      const quidaxSignatureHeader = req.headers['quidax-signature'];

      if (!quidaxSignatureHeader || typeof quidaxSignatureHeader !== 'string') {
        throw new UnauthorizedException(
          'Missing or invalid Quidax signature header.',
        );
      }

      const [timestampSection, signatureSection] =
        quidaxSignatureHeader.split(',');

      if (!timestampSection || !signatureSection) {
        throw new UnauthorizedException(
          'Invalid Quidax signature header format.',
        );
      }

      const timestampParts = timestampSection.split('=');
      const signatureParts = signatureSection.split('=');

      const timestamp = timestampParts[1];
      const signature = signatureParts[1];

      const requestBody = JSON.stringify(req.body);

      const payload = `${timestamp}.${requestBody}`;

      const createdSignature = crypto
        .createHmac('sha256', this.quidaxWebhookKey) // Use the stored key
        .update(payload)
        .digest('hex'); // Use 'hex' for direct comparison with a hex string

      if (signature === createdSignature) {
        const event = new AdminPushNotificationEvent(
          this.configService,
          {
            title: 'Successful Webhook',
            body: requestBody,
            sentByAdminId: 'Quidax',
          },
          'jaycass50@gmail.com',
        );
        await this.emailQueueService.handleEmailEvent(event);
        return true; // Signature matches, allow the request
      } else {
        throw new UnauthorizedException('Invalid Quidax signature.');
      }
    } catch (error) {
      // Log the error for debugging purposes (optional but recommended)
      console.error('QuidaxGuard error:', error);
      // Re-throw an UnauthorizedException to prevent sensitive error details from being exposed
      throw new UnauthorizedException('Webhook verification failed.');
    }
  }
}
