import type { z } from 'zod';

import {
  consumeMagicLinkSchema,
  disableMfaSchema,
  enrollMfaSchema,
  generateRecoveryCodesSchema,
  loginSchema,
  registerSchema,
  requestEmailVerificationSchema,
  requestMagicLinkSchema,
  requestOtpSchema,
  requestPasswordResetSchema,
  requestPhoneVerificationSchema,
  resetPasswordSchema,
  revokeSessionSchema,
  stepUpSchema,
  verifyEmailSchema,
  verifyMfaEnrollmentSchema,
  verifyMfaSchema,
  verifyOtpSchema,
  verifyPhoneSchema,
} from './schemas';
import type { ApiClient } from '../trpc';

export async function loginWithPassword(
  client: ApiClient,
  email: string,
  password: string
): Promise<Awaited<ReturnType<ApiClient['auth']['login']['mutate']>>> {
  return client.auth.login.mutate(loginSchema.parse({ email, password }));
}

export async function registerOrgAndUser(
  client: ApiClient,
  payload: z.infer<typeof registerSchema>
): Promise<Awaited<ReturnType<ApiClient['auth']['register']['mutate']>>> {
  return client.auth.register.mutate(registerSchema.parse(payload));
}

export async function refreshAccessToken(
  client: ApiClient,
  refreshToken: string
): Promise<Awaited<ReturnType<ApiClient['auth']['refresh']['mutate']>>> {
  return client.auth.refresh.mutate({ refreshToken });
}

export async function logout(client: ApiClient) {
  return client.auth.logout.mutate();
}

export async function requestOtp(client: ApiClient, payload: z.infer<typeof requestOtpSchema>) {
  return client.auth.requestOtp.mutate(requestOtpSchema.parse(payload));
}

export async function verifyOtp(client: ApiClient, payload: z.infer<typeof verifyOtpSchema>) {
  return client.auth.verifyOtp.mutate(verifyOtpSchema.parse(payload));
}

export async function requestMagicLink(
  client: ApiClient,
  payload: z.infer<typeof requestMagicLinkSchema>
): Promise<Awaited<ReturnType<ApiClient['auth']['requestMagicLink']['mutate']>>> {
  return client.auth.requestMagicLink.mutate(requestMagicLinkSchema.parse(payload));
}

export async function consumeMagicLink(
  client: ApiClient,
  payload: z.infer<typeof consumeMagicLinkSchema>
): Promise<Awaited<ReturnType<ApiClient['auth']['consumeMagicLink']['mutate']>>> {
  return client.auth.consumeMagicLink.mutate(consumeMagicLinkSchema.parse(payload));
}

export async function requestEmailVerification(client: ApiClient) {
  return client.auth.requestEmailVerification.mutate(requestEmailVerificationSchema.parse({}));
}

export async function verifyEmail(client: ApiClient, payload: z.infer<typeof verifyEmailSchema>) {
  return client.auth.verifyEmail.mutate(verifyEmailSchema.parse(payload));
}

export async function requestPhoneVerification(
  client: ApiClient,
  payload: z.infer<typeof requestPhoneVerificationSchema>
): Promise<Awaited<ReturnType<ApiClient['auth']['requestPhoneVerification']['mutate']>>> {
  return client.auth.requestPhoneVerification.mutate(requestPhoneVerificationSchema.parse(payload));
}

export async function verifyPhone(client: ApiClient, payload: z.infer<typeof verifyPhoneSchema>) {
  return client.auth.verifyPhone.mutate(verifyPhoneSchema.parse(payload));
}

export async function requestPasswordReset(
  client: ApiClient,
  payload: z.infer<typeof requestPasswordResetSchema>
): Promise<Awaited<ReturnType<ApiClient['auth']['requestPasswordReset']['mutate']>>> {
  return client.auth.requestPasswordReset.mutate(requestPasswordResetSchema.parse(payload));
}

export async function resetPassword(client: ApiClient, payload: z.infer<typeof resetPasswordSchema>) {
  return client.auth.resetPassword.mutate(resetPasswordSchema.parse(payload));
}

export async function enrollMfa(client: ApiClient) {
  return client.auth.enrollMfa.mutate(enrollMfaSchema.parse({}));
}

export async function verifyMfaEnrollment(
  client: ApiClient,
  payload: z.infer<typeof verifyMfaEnrollmentSchema>
): Promise<Awaited<ReturnType<ApiClient['auth']['verifyMfaEnrollment']['mutate']>>> {
  return client.auth.verifyMfaEnrollment.mutate(verifyMfaEnrollmentSchema.parse(payload));
}

export async function generateRecoveryCodes(client: ApiClient) {
  return client.auth.generateRecoveryCodes.mutate(generateRecoveryCodesSchema.parse({}));
}

export async function verifyMfa(client: ApiClient, payload: z.infer<typeof verifyMfaSchema>) {
  return client.auth.verifyMfa.mutate(verifyMfaSchema.parse(payload));
}

export async function disableMfa(client: ApiClient, payload: z.infer<typeof disableMfaSchema>) {
  return client.auth.disableMfa.mutate(disableMfaSchema.parse(payload));
}

export async function stepUpAuth(client: ApiClient, payload: z.infer<typeof stepUpSchema>) {
  return client.auth.stepUp.mutate(stepUpSchema.parse(payload));
}

export async function listSessions(client: ApiClient) {
  return client.auth.listSessions.query();
}

export async function revokeSession(client: ApiClient, payload: z.infer<typeof revokeSessionSchema>) {
  return client.auth.revokeSession.mutate(revokeSessionSchema.parse(payload));
}
