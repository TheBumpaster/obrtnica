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

// Lightweight API wrappers around existing tRPC procedures.

type AnyClient = {
  auth: Record<string, any>;
};

export async function loginWithPassword(
  client: AnyClient,
  email: string,
  password: string
): Promise<Awaited<ReturnType<AnyClient['auth']['login']['mutate']>>> {
  return client.auth.login.mutate(loginSchema.parse({ email, password }));
}

export async function registerOrgAndUser(
  client: AnyClient,
  payload: z.infer<typeof registerSchema>
): Promise<Awaited<ReturnType<AnyClient['auth']['register']['mutate']>>> {
  return client.auth.register.mutate(registerSchema.parse(payload));
}

export async function refreshAccessToken(
  client: AnyClient,
  refreshToken: string
): Promise<Awaited<ReturnType<AnyClient['auth']['refresh']['mutate']>>> {
  return client.auth.refresh.mutate({ refreshToken });
}

export async function logout(client: AnyClient): Promise<any> {
  return client.auth.logout.mutate();
}

export async function requestOtp(
  client: AnyClient,
  payload: z.infer<typeof requestOtpSchema>
): Promise<any> {
  return client.auth.requestOtp.mutate(requestOtpSchema.parse(payload));
}

export async function verifyOtp(
  client: AnyClient,
  payload: z.infer<typeof verifyOtpSchema>
): Promise<any> {
  return client.auth.verifyOtp.mutate(verifyOtpSchema.parse(payload));
}

export async function requestMagicLink(
  client: AnyClient,
  payload: z.infer<typeof requestMagicLinkSchema>
): Promise<any> {
  return client.auth.requestMagicLink.mutate(requestMagicLinkSchema.parse(payload));
}

export async function consumeMagicLink(
  client: AnyClient,
  payload: z.infer<typeof consumeMagicLinkSchema>
): Promise<any> {
  return client.auth.consumeMagicLink.mutate(consumeMagicLinkSchema.parse(payload));
}

export async function requestEmailVerification(client: AnyClient): Promise<any> {
  return client.auth.requestEmailVerification.mutate(requestEmailVerificationSchema.parse({}));
}

export async function verifyEmail(
  client: AnyClient,
  payload: z.infer<typeof verifyEmailSchema>
): Promise<any> {
  return client.auth.verifyEmail.mutate(verifyEmailSchema.parse(payload));
}

export async function requestPhoneVerification(
  client: AnyClient,
  payload: z.infer<typeof requestPhoneVerificationSchema>
): Promise<any> {
  return client.auth.requestPhoneVerification.mutate(requestPhoneVerificationSchema.parse(payload));
}

export async function verifyPhone(
  client: AnyClient,
  payload: z.infer<typeof verifyPhoneSchema>
): Promise<any> {
  return client.auth.verifyPhone.mutate(verifyPhoneSchema.parse(payload));
}

export async function requestPasswordReset(
  client: AnyClient,
  payload: z.infer<typeof requestPasswordResetSchema>
): Promise<any> {
  return client.auth.requestPasswordReset.mutate(requestPasswordResetSchema.parse(payload));
}

export async function resetPassword(
  client: AnyClient,
  payload: z.infer<typeof resetPasswordSchema>
): Promise<any> {
  return client.auth.resetPassword.mutate(resetPasswordSchema.parse(payload));
}

export async function enrollMfa(client: AnyClient): Promise<any> {
  return client.auth.enrollMfa.mutate(enrollMfaSchema.parse({}));
}

export async function verifyMfaEnrollment(
  client: AnyClient,
  payload: z.infer<typeof verifyMfaEnrollmentSchema>
): Promise<any> {
  return client.auth.verifyMfaEnrollment.mutate(verifyMfaEnrollmentSchema.parse(payload));
}

export async function generateRecoveryCodes(client: AnyClient): Promise<any> {
  return client.auth.generateRecoveryCodes.mutate(generateRecoveryCodesSchema.parse({}));
}

export async function verifyMfa(
  client: AnyClient,
  payload: z.infer<typeof verifyMfaSchema>
): Promise<any> {
  return client.auth.verifyMfa.mutate(verifyMfaSchema.parse(payload));
}

export async function disableMfa(
  client: AnyClient,
  payload: z.infer<typeof disableMfaSchema>
): Promise<any> {
  return client.auth.disableMfa.mutate(disableMfaSchema.parse(payload));
}

export async function stepUpAuth(
  client: AnyClient,
  payload: z.infer<typeof stepUpSchema>
): Promise<any> {
  return client.auth.stepUp.mutate(stepUpSchema.parse(payload));
}

export async function listSessions(client: AnyClient): Promise<any> {
  return client.auth.listSessions.query({});
}

export async function revokeSession(
  client: AnyClient,
  payload: z.infer<typeof revokeSessionSchema>
): Promise<any> {
  return client.auth.revokeSession.mutate(revokeSessionSchema.parse(payload));
}
