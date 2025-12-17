import Mailjet from 'node-mailjet';

import { config } from '../config';

export interface EmailPayload {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
}

export class MailjetAdapter {
  private client: Mailjet | null = null;
  private dryRun: boolean;

  constructor(dryRun = false) {
    this.dryRun = dryRun;
    
    if (!dryRun && config.MAILJET_API_KEY && config.MAILJET_SECRET_KEY) {
      this.client = new Mailjet({
        apiKey: config.MAILJET_API_KEY,
        apiSecret: config.MAILJET_SECRET_KEY,
      });
    }
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    if (this.dryRun || !this.client) {
      console.log('[DRY RUN] Would send email via Mailjet:', {
        to: payload.to,
        subject: payload.subject,
      });
      return;
    }

    try {
      const request = this.client.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: 'noreply@serp.app',
              Name: 'Serp',
            },
            To: [
              {
                Email: payload.to,
              },
            ],
            Subject: payload.subject,
            TextPart: payload.textBody,
            HTMLPart: payload.htmlBody,
          },
        ],
      });

      await request;
      console.log(`Sent email to ${payload.to} via Mailjet`);
    } catch (err) {
      console.error('Mailjet send error:', err);
      throw err;
    }
  }
}
