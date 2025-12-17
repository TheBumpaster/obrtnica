import { ulid } from 'ulid';

import type { DomainEvent } from './types';

/**
 * Email verification requested
 */
export interface EmailVerificationRequestedPayload {
  userId: string;
  email: string;
  token: string; // Not hashed, for sending in email
}

export function createEmailVerificationRequested(
  tenantId: string,
  payload: EmailVerificationRequestedPayload,
  correlationId?: string
): DomainEvent<EmailVerificationRequestedPayload> {
  return {
    eventId: ulid(),
    eventType: 'auth.email_verification.requested',
    eventVersion: '1',
    tenantId,
    occurredAt: new Date(),
    correlationId,
    payload,
  };
}

/**
 * Password reset requested
 */
export interface PasswordResetRequestedPayload {
  userId: string;
  email: string;
  token: string; // Not hashed, for sending in email
}

export function createPasswordResetRequested(
  tenantId: string,
  payload: PasswordResetRequestedPayload,
  correlationId?: string
): DomainEvent<PasswordResetRequestedPayload> {
  return {
    eventId: ulid(),
    eventType: 'auth.password_reset.requested',
    eventVersion: '1',
    tenantId,
    occurredAt: new Date(),
    correlationId,
    payload,
  };
}

/**
 * Magic link requested
 */
export interface MagicLinkRequestedPayload {
  userId: string;
  email: string;
  token: string; // Not hashed, for sending in email
}

export function createMagicLinkRequested(
  tenantId: string,
  payload: MagicLinkRequestedPayload,
  correlationId?: string
): DomainEvent<MagicLinkRequestedPayload> {
  return {
    eventId: ulid(),
    eventType: 'auth.magic_link.requested',
    eventVersion: '1',
    tenantId,
    occurredAt: new Date(),
    correlationId,
    payload,
  };
}

/**
 * OTP requested
 */
export interface OtpRequestedPayload {
  userId: string;
  email: string;
  code: string; // Not hashed, for sending
  purpose: 'LOGIN' | 'VERIFICATION' | 'MFA';
}

export function createOtpRequested(
  tenantId: string,
  payload: OtpRequestedPayload,
  correlationId?: string
): DomainEvent<OtpRequestedPayload> {
  return {
    eventId: ulid(),
    eventType: 'auth.otp.requested',
    eventVersion: '1',
    tenantId,
    occurredAt: new Date(),
    correlationId,
    payload,
  };
}
