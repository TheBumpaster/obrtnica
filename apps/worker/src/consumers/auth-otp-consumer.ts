import type { DomainEvent } from '@serp/core';

import { MailjetAdapter } from '../adapters/mailjet';
import { config } from '../config';

const mailjet = new MailjetAdapter(config.NOTIFICATIONS_DRY_RUN === 'true');

interface OtpPayload {
  userId: string;
  email: string;
  code: string;
  purpose: 'LOGIN' | 'VERIFICATION' | 'MFA';
}

/**
 * Consumer for OTP code events
 */
export async function consumeAuthOtpEvent(event: DomainEvent): Promise<void> {
  try {
    if (event.eventType !== 'auth.otp.requested') {
      console.warn(`Unknown OTP event type: ${event.eventType}`);
      return;
    }

    const payload = event.payload as unknown as OtpPayload;

    // Determine message based on purpose
    let subject: string;
    let message: string;

    switch (payload.purpose) {
      case 'LOGIN':
        subject = 'Your login code';
        message = `Your login code is: ${payload.code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please secure your account immediately.`;
        break;

      case 'VERIFICATION':
        subject = 'Your verification code';
        message = `Your verification code is: ${payload.code}\n\nThis code will expire in 10 minutes.`;
        break;

      case 'MFA':
        subject = 'Your authentication code';
        message = `Your authentication code is: ${payload.code}\n\nThis code will expire in 5 minutes.`;
        break;

      default:
        subject = 'Your security code';
        message = `Your security code is: ${payload.code}`;
    }

    // Send via email (primary method)
    await mailjet.sendEmail({
      to: payload.email,
      subject,
      textBody: message,
      htmlBody: `
        <h2>${subject}</h2>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace; background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
          ${payload.code}
        </p>
        <p>${message.split('\n\n')[1]}</p>
        ${payload.purpose === 'LOGIN' ? '<p><small>If you didn\'t request this, please secure your account immediately.</small></p>' : ''}
      `,
    });

    console.log(`Sent OTP code to ${payload.email} for user ${payload.userId} (purpose: ${payload.purpose})`);

    // TODO: If user has a phone number on file, also send via SMS
    // const user = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    // if (user[0]?.phone) {
    //   await twilio.sendSms({
    //     to: user[0].phone,
    //     body: `Your code: ${payload.code}`,
    //   });
    // }
  } catch (error) {
    console.error(`Error processing OTP event:`, error);
    throw error;
  }
}
