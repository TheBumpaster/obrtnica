/**
 * Repository interfaces for auth domain
 * Implementations live in apps/api using Drizzle
 */

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  lockedUntil: Date | null;
  failedLoginCount: number;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  activeOrgId: string | null;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  ip: string | null;
  userAgent: string | null;
  deviceLabel: string | null;
}

export interface RefreshToken {
  id: string;
  sessionId: string;
  tokenHash: string;
  familyId: string;
  rotatedAt: Date | null;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface EmailVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface MagicLinkToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface OtpCode {
  id: string;
  userId: string;
  codeHash: string;
  purpose: 'LOGIN' | 'VERIFICATION' | 'MFA';
  expiresAt: Date;
  usedAt: Date | null;
  attemptCount: number;
  createdAt: Date;
}

export interface OrgMembership {
  id: string;
  userId: string;
  orgId: string;
  roles: string[];
  deletedAt: Date | null;
  createdAt: Date;
}

/**
 * Auth repository interface
 */
export interface IAuthRepository {
  // User operations
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(data: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
  }): Promise<void>;
  updateUser(
    id: string,
    data: Partial<{
      emailVerifiedAt: Date | null;
      lastLoginAt: Date | null;
      lockedUntil: Date | null;
      failedLoginCount: number;
      passwordHash: string;
    }>
  ): Promise<void>;

  // Organization operations
  createOrg(data: { id: string; name: string }): Promise<void>;
  createOrgMembership(data: { id: string; userId: string; orgId: string }): Promise<void>;
  getOrgMemberships(userId: string): Promise<OrgMembership[]>;
  // Recovery: Find orgs that might belong to a user (for orphaned users)
  findOrgsForRecovery(userId: string): Promise<Array<{ id: string; name: string }>>;

  // Session operations
  createSession(data: {
    id: string;
    userId: string;
    activeOrgId: string;
    expiresAt: Date;
    ip?: string;
    userAgent?: string;
  }): Promise<void>;
  getSessionById(id: string): Promise<Session | null>;
  getUserSessions(userId: string): Promise<Session[]>;
  updateSession(id: string, data: Partial<{ lastSeenAt: Date; revokedAt: Date }>): Promise<void>;

  // Refresh token operations
  createRefreshToken(data: {
    id: string;
    sessionId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<void>;
  getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null>;
  updateRefreshToken(id: string, data: Partial<{ rotatedAt: Date; revokedAt: Date }>): Promise<void>;
  revokeRefreshTokenFamily(familyId: string): Promise<void>;
  revokeSessionRefreshTokens(sessionId: string): Promise<void>;

  // Email verification operations
  createEmailVerificationToken(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  getEmailVerificationTokenByHash(tokenHash: string): Promise<EmailVerificationToken | null>;
  updateEmailVerificationToken(id: string, data: { usedAt: Date }): Promise<void>;

  // Password reset operations
  createPasswordResetToken(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  getPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | null>;
  updatePasswordResetToken(id: string, data: { usedAt: Date }): Promise<void>;

  // Magic link operations
  createMagicLinkToken(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  getMagicLinkTokenByHash(tokenHash: string): Promise<MagicLinkToken | null>;
  updateMagicLinkToken(id: string, data: { usedAt: Date }): Promise<void>;

  // OTP operations
  createOtpCode(data: {
    id: string;
    userId: string;
    codeHash: string;
    purpose: 'LOGIN' | 'VERIFICATION' | 'MFA';
    expiresAt: Date;
  }): Promise<void>;
  getOtpCodesByUser(userId: string, purpose: string): Promise<OtpCode[]>;
  updateOtpCode(id: string, data: { usedAt?: Date; attemptCount?: number }): Promise<void>;
}
