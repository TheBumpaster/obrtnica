/**
 * Auth repository implementation using Drizzle
 */

import type {
  IAuthRepository,
  User,
  Session,
  RefreshToken,
  EmailVerificationToken,
  PasswordResetToken,
  MagicLinkToken,
  OtpCode,
  OrgMembership,
} from '@serp/core';
import { eq, and, isNull, gte, lte } from 'drizzle-orm';

import type { Database } from '../db';
import {
  users,
  orgs,
  orgMemberships,
  authSessions,
  authRefreshTokens,
  authEmailVerificationTokens,
  authPasswordResetTokens,
  authMagicLinkTokens,
  authOtpCodes,
} from '../db';

export class AuthRepository implements IAuthRepository {
  constructor(private db: Database) {}

  // User operations
  async getUserByEmail(email: string): Promise<User | null> {
    const results = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return results.length > 0 ? results[0] : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const results = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return results.length > 0 ? results[0] : null;
  }

  async createUser(data: { id: string; email: string; passwordHash: string; name: string }): Promise<void> {
    await this.db.insert(users).values({
      id: data.id,
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      emailVerifiedAt: null,
      failedLoginCount: 0,
    });
  }

  async updateUser(
    id: string,
    data: Partial<{
      emailVerifiedAt: Date | null;
      lastLoginAt: Date | null;
      lockedUntil: Date | null;
      failedLoginCount: number;
      passwordHash: string;
    }>
  ): Promise<void> {
    await this.db.update(users).set(data).where(eq(users.id, id));
  }

  // Organization operations
  async createOrg(data: { id: string; name: string }): Promise<void> {
    await this.db.insert(orgs).values(data);
  }

  async createOrgMembership(data: { id: string; userId: string; orgId: string }): Promise<void> {
    await this.db.insert(orgMemberships).values({
      id: data.id,
      userId: data.userId,
      orgId: data.orgId,
      roles: [],
    });
  }

  async getOrgMemberships(userId: string): Promise<OrgMembership[]> {
    return await this.db
      .select()
      .from(orgMemberships)
      .where(and(eq(orgMemberships.userId, userId), isNull(orgMemberships.deletedAt)));
  }

  async findOrgsForRecovery(userId: string): Promise<Array<{ id: string; name: string }>> {
    // Find orgs that were created around the same time as the user
    // This is a heuristic to recover from orphaned users (users without memberships)
    // This handles cases where registration partially succeeded (user/org created but membership failed)
    const user = await this.getUserById(userId);
    if (!user) {
      return [];
    }

    // Find orgs created within 5 minutes of user creation (registration window)
    // This helps recover users who registered before generateId() was fixed
    const timeWindowStart = new Date(user.createdAt.getTime() - 5 * 60 * 1000);
    const timeWindowEnd = new Date(user.createdAt.getTime() + 5 * 60 * 1000);
    
    const results = await this.db
      .select({
        id: orgs.id,
        name: orgs.name,
      })
      .from(orgs)
      .where(
        and(
          isNull(orgs.deletedAt),
          gte(orgs.createdAt, timeWindowStart),
          lte(orgs.createdAt, timeWindowEnd)
        )
      )
      .orderBy(orgs.createdAt)
      .limit(1);

    return results;
  }

  // Session operations
  async createSession(data: {
    id: string;
    userId: string;
    activeOrgId: string;
    expiresAt: Date;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.db.insert(authSessions).values({
      id: data.id,
      userId: data.userId,
      activeOrgId: data.activeOrgId,
      createdAt: new Date(),
      lastSeenAt: new Date(),
      expiresAt: data.expiresAt,
      ip: data.ip || null,
      userAgent: data.userAgent || null,
    });
  }

  async getSessionById(id: string): Promise<Session | null> {
    const results = await this.db.select().from(authSessions).where(eq(authSessions.id, id)).limit(1);
    return results.length > 0 ? results[0] : null;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return await this.db
      .select()
      .from(authSessions)
      .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
  }

  async updateSession(id: string, data: Partial<{ lastSeenAt: Date; revokedAt: Date }>): Promise<void> {
    await this.db.update(authSessions).set(data).where(eq(authSessions.id, id));
  }

  // Refresh token operations
  async createRefreshToken(data: {
    id: string;
    sessionId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(authRefreshTokens).values(data);
  }

  async getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    const results = await this.db
      .select()
      .from(authRefreshTokens)
      .where(eq(authRefreshTokens.tokenHash, tokenHash))
      .limit(1);
    return results.length > 0 ? results[0] : null;
  }

  async updateRefreshToken(id: string, data: Partial<{ rotatedAt: Date; revokedAt: Date }>): Promise<void> {
    await this.db.update(authRefreshTokens).set(data).where(eq(authRefreshTokens.id, id));
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.db
      .update(authRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(authRefreshTokens.familyId, familyId));
  }

  async revokeSessionRefreshTokens(sessionId: string): Promise<void> {
    await this.db
      .update(authRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(authRefreshTokens.sessionId, sessionId));
  }

  // Email verification operations
  async createEmailVerificationToken(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(authEmailVerificationTokens).values(data);
  }

  async getEmailVerificationTokenByHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    const results = await this.db
      .select()
      .from(authEmailVerificationTokens)
      .where(eq(authEmailVerificationTokens.tokenHash, tokenHash))
      .limit(1);
    return results.length > 0 ? results[0] : null;
  }

  async updateEmailVerificationToken(id: string, data: { usedAt: Date }): Promise<void> {
    await this.db.update(authEmailVerificationTokens).set(data).where(eq(authEmailVerificationTokens.id, id));
  }

  // Password reset operations
  async createPasswordResetToken(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(authPasswordResetTokens).values(data);
  }

  async getPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const results = await this.db
      .select()
      .from(authPasswordResetTokens)
      .where(eq(authPasswordResetTokens.tokenHash, tokenHash))
      .limit(1);
    return results.length > 0 ? results[0] : null;
  }

  async updatePasswordResetToken(id: string, data: { usedAt: Date }): Promise<void> {
    await this.db.update(authPasswordResetTokens).set(data).where(eq(authPasswordResetTokens.id, id));
  }

  // Magic link operations
  async createMagicLinkToken(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(authMagicLinkTokens).values(data);
  }

  async getMagicLinkTokenByHash(tokenHash: string): Promise<MagicLinkToken | null> {
    const results = await this.db
      .select()
      .from(authMagicLinkTokens)
      .where(eq(authMagicLinkTokens.tokenHash, tokenHash))
      .limit(1);
    return results.length > 0 ? results[0] : null;
  }

  async updateMagicLinkToken(id: string, data: { usedAt: Date }): Promise<void> {
    await this.db.update(authMagicLinkTokens).set(data).where(eq(authMagicLinkTokens.id, id));
  }

  // OTP operations
  async createOtpCode(data: {
    id: string;
    userId: string;
    codeHash: string;
    purpose: 'LOGIN' | 'VERIFICATION' | 'MFA';
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(authOtpCodes).values({
      ...data,
      attemptCount: 0,
    });
  }

  async getOtpCodesByUser(userId: string, purpose: string): Promise<OtpCode[]> {
    const results = await this.db
      .select()
      .from(authOtpCodes)
      .where(and(eq(authOtpCodes.userId, userId), eq(authOtpCodes.purpose, purpose)));
    return results.map((r) => ({
      ...r,
      purpose: r.purpose as OtpCode['purpose'],
    }));
  }

  async updateOtpCode(id: string, data: { usedAt?: Date; attemptCount?: number }): Promise<void> {
    await this.db.update(authOtpCodes).set(data).where(eq(authOtpCodes.id, id));
  }
}
