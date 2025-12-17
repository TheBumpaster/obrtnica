import { z } from 'zod';

// Registration & Login
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).max(128),
  name: z.string().min(1).max(200),
  orgName: z.string().min(1).max(200),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const logoutSchema = z.object({
  sessionId: z.string().optional(),
  allSessions: z.boolean().optional(),
});

// Email verification
export const requestEmailVerificationSchema = z.object({});

export const verifyEmailSchema = z.object({
  token: z.string(),
});

// Password reset
export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(12).max(128),
});

// Passwordless
export const requestMagicLinkSchema = z.object({
  email: z.string().email(),
});

export const consumeMagicLinkSchema = z.object({
  token: z.string(),
});

export const requestOtpSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(['LOGIN', 'VERIFICATION', 'MFA']),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: z.enum(['LOGIN', 'VERIFICATION', 'MFA']),
});

// Session management
export const listSessionsSchema = z.object({});

export const revokeSessionSchema = z.object({
  sessionId: z.string(),
});

export const revokeAllSessionsSchema = z.object({
  exceptCurrent: z.boolean().optional(),
});

// Response schemas
export const authTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export const sessionSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  lastSeenAt: z.string(),
  expiresAt: z.string(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  deviceLabel: z.string().optional(),
  isCurrent: z.boolean(),
});

export const listSessionsResponseSchema = z.object({
  sessions: z.array(sessionSchema),
});

// MFA schemas
export const enrollMfaSchema = z.object({});

export const enrollMfaResponseSchema = z.object({
  secret: z.string(),
  qrCodeUri: z.string(),
});

export const verifyMfaEnrollmentSchema = z.object({
  code: z.string().length(6),
});

export const generateRecoveryCodesSchema = z.object({});

export const generateRecoveryCodesResponseSchema = z.object({
  codes: z.array(z.string()),
});

export const verifyMfaSchema = z.object({
  code: z.string().length(6),
});

export const stepUpSchema = z.object({
  method: z.enum(['password', 'mfa']),
  credential: z.string(), // password or MFA code
});

export const disableMfaSchema = z.object({
  code: z.string().length(6), // Require MFA code to disable
});
