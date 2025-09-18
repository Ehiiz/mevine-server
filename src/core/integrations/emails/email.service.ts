import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { BaseEmailEvent } from './email.utils';
import { Injectable, Logger } from '@nestjs/common';
import { SendMailClient } from 'zeptomail'; // Assuming this is the correct import

export interface MailAttachment {
  filename: string;
  path?: string; // Path to the file
  content?: Buffer | string; // Or raw content
  contentType?: string; // e.g., 'text/plain', 'application/pdf'
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private zohoTransport: any;

  constructor(public readonly configService: ConfigService) {
    this.logger.debug(
      'Initializing EmailService...',
      this.configService.get<string>('NODEMAILER_HOST'),
    );
    this.initiateZohoTransport();
  }

  private initiateZohoTransport() {
    this.zohoTransport = new SendMailClient({
      url: `${this.configService.get<string>('ZOHO_MAIL_URL')}`,
      token: `${this.configService.get<string>('ZOHO_MAIL_TOKEN')}`,
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
    const { email, emailTemplate, attachments, emailSubject, ...emailData } =
      event;

    const mailHtml = this.generateEmailHelpers(emailTemplate, {
      ...emailData,
    });

    // 2. Render the base layout, injecting the content body
    const finalHtml = this.generateEmailHelpers('base-layout', {
      emailSubject: emailSubject,
      body: mailHtml,
      year: new Date().getFullYear(), // Add year to payload for footer
    });

    console.log(mailHtml);

    await this.sendMail({
      to: email,
      subject: emailSubject,
      html: mailHtml,
      ...(attachments && { attachments: attachments }),
    });
  }

  public async sendMail(mailOptions: {
    to: string;
    subject: string;
    html: string;
    attachments?: MailAttachment[];
  }) {
    // Transform attachments to match Zoho's expected format
    const transformedAttachments = mailOptions.attachments?.map(
      (attachment) => {
        // Ensure content is properly encoded as base64 if it's not already
        let base64Content;
        if (Buffer.isBuffer(attachment.content)) {
          base64Content = attachment.content.toString('base64');
        } else if (typeof attachment.content === 'string') {
          // If it's already a string, check if it's base64
          base64Content = attachment.content.startsWith('data:')
            ? attachment.content.split(',')[1]
            : attachment.content;
        }

        return {
          name: attachment.filename,
          content: base64Content,
          mime_type: attachment.contentType,
          disposition: 'attachment', // Explicitly set disposition
        };
      },
    );

    const sendOptions = {
      subject: mailOptions.subject,
      from: {
        address: process.env.ZOHO_FROM_EMAIL || 'noreply@odolearn.com',
        name: process.env.APP_NAME || 'Application',
      },
      to: [
        {
          email_address: {
            address: mailOptions.to,
            name: 'User',
          },
        },
      ],
      htmlbody: mailOptions.html,
      track_clicks: true,
      track_opens: true,
      ...(transformedAttachments && { attachments: transformedAttachments }),
    };

    try {
      this.logger.log(
        'Sending mail with options:',
        JSON.stringify({
          ...sendOptions,
          attachments: sendOptions.attachments?.map((a) => ({
            filename: a.name,
            mime_type: a.mime_type,
            disposition: a.disposition,
          })),
        }),
      );
      await this.zohoTransport.sendMail(sendOptions);
      this.logger.log('Email sent successfully');
    } catch (error) {
      this.logger.log('Error sending mail:', error);
      this.logger.log(
        'Error details:',
        error.details ? JSON.stringify(error.details, null, 2) : undefined,
      );
      this.logger.log('Full error object:', JSON.stringify(error, null, 2));
      throw error;
    }
  }
}
