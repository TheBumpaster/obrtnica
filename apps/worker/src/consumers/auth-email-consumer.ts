import { createChildLogger, type DomainEvent } from '@serp/core';

import { MailjetAdapter } from '../adapters/mailjet';
import { config } from '../config';

const mailjet = new MailjetAdapter(config.NOTIFICATIONS_DRY_RUN === 'true');
const logger = createChildLogger({ component: 'auth-email-consumer' });

interface EmailVerificationPayload {
  userId: string;
  email: string;
  token: string;
}

interface PasswordResetPayload {
  userId: string;
  email: string;
  token: string;
}

interface MagicLinkPayload {
  userId: string;
  email: string;
  token: string;
}

/**
 * Consumer for auth-related email events
 */
export async function consumeAuthEmailEvent(event: DomainEvent): Promise<void> {
  try {
    switch (event.eventType) {
      case 'auth.email_verification.requested': {
        const payload = event.payload as unknown as EmailVerificationPayload;
        const verificationLink = `${getBaseUrl()}/verify-email?token=${payload.token}`;

        await mailjet.sendEmail({
          to: payload.email,
          subject: 'Verify your email address',
          textBody: `Welcome! Please verify your email address by clicking the link below:\n\n${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.`,
          htmlBody: `
            <h2>Welcome!</h2>
            <p>Please verify your email address by clicking the button below:</p>
            <p><a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verificationLink}</p>
            <p><small>This link will expire in 24 hours.</small></p>
            <p><small>If you didn't create an account, you can safely ignore this email.</small></p>
          `,
        });

        logger.info({ userId: payload.userId, email: payload.email }, 'Sent email verification');
        break;
      }

      case 'auth.password_reset.requested': {
        const payload = event.payload as unknown as PasswordResetPayload;
        const resetLink = `${getBaseUrl()}/reset-password?token=${payload.token}`;

        await mailjet.sendEmail({
          to: payload.email,
          subject: 'Reset your password',
          textBody: `You requested to reset your password. Click the link below to continue:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`,
          htmlBody: `
            <h2>Reset your password</h2>
            <p>You requested to reset your password. Click the button below to continue:</p>
            <p><a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${resetLink}</p>
            <p><small>This link will expire in 1 hour.</small></p>
            <p><small>If you didn't request this, you can safely ignore this email. Your password will not be changed.</small></p>
          `,
        });

        logger.info({ userId: payload.userId, email: payload.email }, 'Sent password reset email');
        break;
      }

      case 'auth.magic_link.requested': {
        const payload = event.payload as unknown as MagicLinkPayload;
        const magicLink = `${getBaseUrl()}/magic-link?token=${payload.token}`;

        await mailjet.sendEmail({
          to: payload.email,
          subject: 'Your magic link to sign in',
          textBody: `Click the link below to sign in:\n\n${magicLink}\n\nThis link will expire in 15 minutes and can only be used once.\n\nIf you didn't request this, you can safely ignore this email.`,
          htmlBody: `
            <h2>Sign in to your account</h2>
            <p>Click the button below to sign in:</p>
            <p><a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Sign In</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${magicLink}</p>
            <p><small>This link will expire in 15 minutes and can only be used once.</small></p>
            <p><small>If you didn't request this, you can safely ignore this email.</small></p>
          `,
        });

        logger.info({ userId: payload.userId, email: payload.email }, 'Sent magic link');
        break;
      }

      default:
        logger.warn({ eventType: event.eventType }, 'Unknown auth email event type');
    }
  } catch (error) {
    logger.error({ err: error, eventType: event.eventType }, 'Error processing auth email event');
    throw error;
  }
}

/**
 * Get base URL for email links
 */
function getBaseUrl(): string {
  return config.APP_BASE_URL;
}
