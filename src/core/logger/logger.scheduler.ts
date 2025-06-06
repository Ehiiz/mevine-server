import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from '../integrations/emails/email.service';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment-timezone';

@Injectable()
export class LogSchedulerService {
  private readonly logger = new Logger(LogSchedulerService.name);

  constructor(private readonly emailService: EmailService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Africa/Lagos',
  })
  async handleDailyLogEmail() {
    this.logger.log('Running daily log email job...');

    // 1. Determine yesterday's date to find the correct log file
    const yesterday = moment()
      .tz('Africa/Lagos')
      .subtract(1, 'day')
      .format('YYYY-MM-DD');
    const logFileName = `combined-${yesterday}.log`;
    const logFilePath = path.join(process.cwd(), 'logs', logFileName);

    // 2. Check if the log file exists
    if (!fs.existsSync(logFilePath)) {
      this.logger.warn(`Log file for ${yesterday} not found. Skipping email.`);
      return;
    }

    // 3. Send the email with the log file as an attachment
    try {
      const subject = `Daily Application Log Report - ${yesterday}`;
      const html = `
        <h1>Daily Log Report</h1>
        <p>Attached is the combined log file for ${yesterday}.</p>
      `;

      await this.emailService.sendMail({
        to: this.emailService.configService.get<string>('ADMIN_EMAIL')!,
        subject,
        html,
        attachments: [
          {
            filename: logFileName,
            path: logFilePath,
            contentType: 'text/plain',
          },
        ],
      });

      this.logger.log(`Successfully sent log report for ${yesterday}.`);
    } catch (error) {
      this.logger.error(
        `Failed to send daily log report for ${yesterday}.`,
        error,
      );
    }
  }
}
