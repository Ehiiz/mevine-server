import { Module } from '@nestjs/common';
import { FatalErrorMailTransport } from './fatal-error-mail.transport';
import { EmailQueueModule } from '../integrations/emails/email-queue.module';

@Module({
  imports: [EmailQueueModule], // Make EmailService available for injection
  providers: [FatalErrorMailTransport],
  exports: [FatalErrorMailTransport], // Export the transport so AppModule can use it
})
export class LoggerModule {}
