import { createChildLogger } from '@serp/core';
import twilio from 'twilio';

import { config } from '../config';

const logger = createChildLogger({ component: 'twilio-adapter' });

export interface SmsPayload {
  to: string;
  body: string;
}

export class TwilioAdapter {
  private client: twilio.Twilio | null = null;
  private dryRun: boolean;
  private fromNumber: string;

  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.fromNumber = config.TWILIO_PHONE_NUMBER || '+1234567890';
    
    if (!dryRun && config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
      this.client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    }
  }

  async sendSms(payload: SmsPayload): Promise<void> {
    if (this.dryRun || !this.client) {
      logger.debug({ to: payload.to, bodyPrefix: payload.body.substring(0, 50) }, '[DRY RUN] Would send SMS via Twilio');
      return;
    }

    try {
      await this.client.messages.create({
        to: payload.to,
        from: this.fromNumber,
        body: payload.body,
      });
      
      logger.info({ to: payload.to }, 'Sent SMS via Twilio');
    } catch (err) {
      logger.error({ err, to: payload.to }, 'Twilio send error');
      throw err;
    }
  }
}
