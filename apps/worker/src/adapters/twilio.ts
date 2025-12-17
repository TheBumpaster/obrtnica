import twilio from 'twilio';

import { config } from '../config';

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
      console.log('[DRY RUN] Would send SMS via Twilio:', {
        to: payload.to,
        body: payload.body.substring(0, 50) + '...',
      });
      return;
    }

    try {
      await this.client.messages.create({
        to: payload.to,
        from: this.fromNumber,
        body: payload.body,
      });
      
      console.log(`Sent SMS to ${payload.to} via Twilio`);
    } catch (err) {
      console.error('Twilio send error:', err);
      throw err;
    }
  }
}
