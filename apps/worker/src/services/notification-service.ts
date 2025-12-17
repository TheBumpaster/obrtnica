import { createChildLogger, type NotificationDelivery } from '@serp/core';
import { eq } from 'drizzle-orm';


import { ApnsAdapter } from '../adapters/apns';
import { FcmAdapter } from '../adapters/fcm';
import { MailjetAdapter } from '../adapters/mailjet';
import { TwilioAdapter } from '../adapters/twilio';
import { config } from '../config';
import { db, deviceTokens } from '../db';

const logger = createChildLogger({ component: 'notification-service' });

export class NotificationService {
  private mailjetAdapter: MailjetAdapter;
  private twilioAdapter: TwilioAdapter;
  private fcmAdapter: FcmAdapter;
  private apnsAdapter: ApnsAdapter;

  constructor() {
    const dryRun = config.NOTIFICATIONS_DRY_RUN === 'true';
    
    this.mailjetAdapter = new MailjetAdapter(dryRun);
    this.twilioAdapter = new TwilioAdapter(dryRun);
    this.fcmAdapter = new FcmAdapter(dryRun);
    this.apnsAdapter = new ApnsAdapter(dryRun);
  }

  async sendEmail(delivery: NotificationDelivery): Promise<void> {
    await this.mailjetAdapter.sendEmail({
      to: delivery.payload.email as string,
      subject: delivery.payload.subject as string,
      textBody: delivery.payload.body as string,
      htmlBody: delivery.payload.htmlBody as string | undefined,
    });
  }

  async sendSms(delivery: NotificationDelivery): Promise<void> {
    await this.twilioAdapter.sendSms({
      to: delivery.payload.phone as string,
      body: delivery.payload.body as string,
    });
  }

  async sendPush(delivery: NotificationDelivery): Promise<void> {
    // Fetch user's device tokens
    const tokens = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.userId, delivery.recipientId));

    for (const deviceToken of tokens) {
      try {
        let result: { success: boolean; invalidToken?: boolean };
        
        if (deviceToken.platform === 'android' || deviceToken.platform === 'web') {
          result = await this.fcmAdapter.sendPush({
            token: deviceToken.token,
            title: delivery.payload.title as string,
            body: delivery.payload.body as string,
            data: delivery.payload.data as Record<string, string> | undefined,
          });
        } else if (deviceToken.platform === 'ios') {
          result = await this.apnsAdapter.sendPush({
            token: deviceToken.token,
            title: delivery.payload.title as string,
            body: delivery.payload.body as string,
            data: delivery.payload.data as Record<string, unknown> | undefined,
          });
        } else {
          logger.warn({ platform: deviceToken.platform }, 'Unknown platform');
          continue;
        }

        // Mark token as invalid if necessary
        if (result.invalidToken) {
          await db
            .update(deviceTokens)
            .set({ isValid: false })
            .where(eq(deviceTokens.id, deviceToken.id));
        }
      } catch (err) {
        logger.error({ err, tokenId: deviceToken.id }, 'Failed to send push to token');
        // Don't throw - continue with other tokens
      }
    }
  }

  async shutdown(): Promise<void> {
    await this.apnsAdapter.shutdown();
  }
}
