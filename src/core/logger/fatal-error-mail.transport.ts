import { Injectable } from '@nestjs/common';
import * as Transport from 'winston-transport';
import { EmailService } from '../integrations/emails/email.service'; // Assuming EmailService is in this path

// We make it an Injectable to use NestJS's DI system
@Injectable()
export class FatalErrorMailTransport extends Transport {
  // Inject your existing EmailService
  constructor(private readonly emailService: EmailService) {
    super({ level: 'error' }); // Only listen for the 'fatal' level
  }

  /**
   * This is the core method of a Winston transport.
   * It gets called when a log entry with a matching level is made.
   * @param info The log object (level, message, stack, etc.)
   * @param callback The callback to signal completion.
   */
  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (info.level === 'fatal') {
      try {
        const subject = 'FATAL ERROR Detected in Application';
        const html = `
          <h1>🚨 Fatal Error</h1>
          <p>A fatal error was logged at ${new Date().toISOString()}. Immediate action may be required.</p>
          <h2>Message:</h2>
          <pre>${info.message}</pre>
          <h2>Stack Trace:</h2>
          <pre>${info.stack}</pre>
        `;

        // Use your existing EmailService to send the alert
        await this.emailService.sendMail({
          to: this.emailService.configService.get<string>('ADMIN_EMAIL')!,
          subject,
          html,
        });
      } catch (err) {
        console.error(
          'CRITICAL: Failed to send fatal error email notification.',
          err,
        );
      }
    }

    callback();
  }
}
