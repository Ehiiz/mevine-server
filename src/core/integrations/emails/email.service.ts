import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { BaseEmailEvent } from './email.utils';
import { Injectable, Logger } from '@nestjs/common';

export interface MailAttachment {
  filename: string;
  path?: string; // Path to the file
  content?: Buffer | string; // Or raw content
  contentType?: string; // e.g., 'text/plain', 'application/pdf'
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  public transporter: nodemailer.Transporter;
  constructor(public readonly configService: ConfigService) {
    this.logger.debug(
      'Initializing EmailService...',
      this.configService.get<string>('NODEMAILER_HOST'),
    );
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('NODEMAILER_HOST')!,
      port: parseInt(this.configService.get<string>('NODEMAILER_PORT')!, 10), // Port should be a number
      secure: this.configService.get<boolean>('NODEMAILER_SECURE') ?? true, // Assuming secure is true by default or configurable
      auth: {
        user: this.configService.get<string>('NODEMAILER_USER')!,
        pass: this.configService.get<string>('NODEMAILER_PASS')!,
      },
      from: `Mevine <${this.configService.get<string>('NODEMAILER_USER')!}>`,
    });
  }

  private generateEmailHelpers(templateName: string, payload: any) {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'core',
      'integrations',
      'emails',
      'templates',
      `${templateName}.hbs`,
    );
    const baseEmailTemplateString = fs.readFileSync(templatePath, 'utf8');

    const baseEmailTemplate = handlebars.compile(baseEmailTemplateString);

    const htmlContent = baseEmailTemplate({ ...payload });
    return htmlContent;
  }

  public async sendEmail(event: BaseEmailEvent) {
    const { email, emailTemplate, emailSubject, ...emailData } = event;

    const mailHtml = this.generateEmailHelpers(emailTemplate, {
      ...emailData,
    });

    // 2. Render the base layout, injecting the content body
    const finalHtml = this.generateEmailHelpers('base-layout', {
      emailSubject: emailSubject,
      body: mailHtml,
      year: new Date().getFullYear(), // Add year to payload for footer
    });

    await this.sendMail({
      to: `${email}`,
      subject: emailSubject,
      html: finalHtml,
    });
  }

  async sendMail(mailOptions: {
    to: string;
    subject: string;
    html: string;
    attachments?: MailAttachment[];
  }) {
    try {
      const sendOptions = {
        ...mailOptions,
        from: `Mevine <${this.configService.get<string>('NODEMAILER_USER')!}>`,
      };
      await this.transporter.sendMail(sendOptions);
      this.logger.log(`Email sent successfully to: ${mailOptions.to}`); // Add success log
    } catch (error) {
      this.logger.error(`Failed to send email to ${mailOptions.to}:`, error);
      throw error; // <-- THIS IS THE KEY CHANGE! Re-throw the error
    }
  }
}
