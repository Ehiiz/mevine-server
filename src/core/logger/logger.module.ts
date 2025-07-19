import { Module } from '@nestjs/common';
import { FatalErrorMailTransport } from './fatal-error-mail.transport';
import { EmailQueueModule } from '../integrations/emails/email-queue.module';
import { WinstonModule } from './winston/winston.module';

@Module({
  imports: [EmailQueueModule, WinstonModule], // Make EmailService available for injection
  providers: [FatalErrorMailTransport],
  exports: [FatalErrorMailTransport], // Export the transport so AppModule can use it
})
export class LoggerModule {}
