import { createChildLogger } from '@serp/core';
import Mailjet from 'node-mailjet';

import { config } from '../config';
import { getTemplateId, type TemplateType, validateTemplateVariables } from './mailjet-templates';

const logger = createChildLogger({ component: 'mailjet-adapter' });

export interface EmailPayload {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
}

export interface TemplatedEmailPayload {
  to: string;
  templateType: TemplateType;
  templateVariables: Record<string, unknown>;
  subject?: string; // Fallback subject if template doesn't include it
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
      logger.debug({ to: payload.to, subject: payload.subject }, '[DRY RUN] Would send email via Mailjet');
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
      logger.info({ to: payload.to }, 'Sent email via Mailjet');
    } catch (err) {
      logger.error({ err, to: payload.to }, 'Mailjet send error');
      throw err;
    }
  }

  async sendTemplatedEmail(payload: TemplatedEmailPayload): Promise<void> {
    if (this.dryRun || !this.client) {
      logger.debug({ to: payload.to, templateType: payload.templateType }, '[DRY RUN] Would send templated email via Mailjet');
      return;
    }

    try {
      const templateId = getTemplateId(payload.templateType);
      
      if (!templateId) {
        // Fallback to plain text if template not configured
        logger.warn({ templateType: payload.templateType }, 'Template not configured, falling back to plain text');
        await this.sendEmail({
          to: payload.to,
          subject: payload.subject || 'Notification',
          textBody: JSON.stringify(payload.templateVariables),
        });
        return;
      }

      // Validate template variables
      const validatedVars = validateTemplateVariables(payload.templateType, payload.templateVariables);

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
            TemplateID: parseInt(templateId, 10),
            TemplateLanguage: true,
            Variables: validatedVars,
            Subject: payload.subject, // Optional override
          },
        ],
      });

      await request;
      logger.info({ to: payload.to, templateType: payload.templateType }, 'Sent templated email via Mailjet');
    } catch (err) {
      logger.error({ err, to: payload.to, templateType: payload.templateType }, 'Mailjet templated email error');
      throw err;
    }
  }
}
