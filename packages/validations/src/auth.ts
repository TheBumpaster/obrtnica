import { z } from 'zod';

// Registration & Login
export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/\d/, 'Password must contain a number')
    .max(128),
  firstName: z.string().min(1).max(200),
  lastName: z.string().min(1).max(200),
  phone: z.string().min(3).max(50),
  orgName: z.string().min(1).max(200),
  orgType: z.string().min(1).max(100),
  address: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  registrationNumber: z.string().min(1).max(50),
  idNumber: z.string().length(13, 'ID broj mora imati 13 cifara'),
  vatNumber: z.string().length(12, 'PDV broj mora imati 12 cifara').optional().or(z.literal('')),
  responsibleName: z.string().min(1).max(200),
  responsibleSurname: z.string().min(1).max(200),
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

// Phone verification
export const requestPhoneVerificationSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g., +1234567890)'),
});

export const verifyPhoneSchema = z.object({
  code: z.string().length(6),
});
