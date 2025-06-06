import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { BaseEmailEvent } from './email.utils';
import { Injectable } from '@nestjs/common';

export interface MailAttachment {
  filename: string;
  path?: string; // Path to the file
  content?: Buffer | string; // Or raw content
  contentType?: string; // e.g., 'text/plain', 'application/pdf'
}

@Injectable()
export class EmailService {
  constructor(public readonly configService: ConfigService) {}

  public transporter = nodemailer.createTransport({
    host: `${process.env.NODEMAILER_HOST}`,
    port: `${process.env.NODEMAILER_PORT}`,
    secure: true,
    auth: {
      user: `${process.env.NODEMAILER_USER}`,
      pass: `${process.env.NODEMAILER_PASS}`,
    },
    from: `Mevine <${process.env.NODEMAILER_USER}>`,
  });

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
    html: string; // html template
    attachments?: MailAttachment[];
  }) {
    const sendOptions = {
      ...mailOptions,
      from: `Mevine <${this.configService.get<string>('NODEMAILER_USER')!}>`,
    };
    await this.transporter.sendMail(sendOptions);
  }
}
