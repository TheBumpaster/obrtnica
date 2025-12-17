import {
  AuditEventTypes,
  buildAuditEvent,
  buildUserActor,
  createEmailVerificationRequested,
  createPasswordResetRequested,
  createMagicLinkRequested,
  createOtpRequested,
  DataCategories,
  DataClassifications,
  encryptString,
  decryptString,
  generateRecoveryCodes,
  generateTotpSecret,
  generateQrCodeUri,
  verifyRecoveryCode,
  verifyTotp,
  AuthDomainService,
  RbacDomainService,
} from '@serp/core';
import { requireUserAuth } from '@serp/trpc';
import {
  authTokenResponseSchema,
  consumeMagicLinkSchema,
  disableMfaSchema,
  enrollMfaResponseSchema,
  enrollMfaSchema,
  generateRecoveryCodesResponseSchema,
  generateRecoveryCodesSchema,
  listSessionsResponseSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  requestEmailVerificationSchema,
  requestMagicLinkSchema,
  requestOtpSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  revokeSessionSchema,
  stepUpSchema,
  verifyEmailSchema,
  verifyMfaEnrollmentSchema,
  verifyMfaSchema,
  verifyOtpSchema,
} from '@serp/validations';
import { TRPCError } from '@trpc/server';
import { eq, and, isNull } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';
import { ulid } from 'ulid';
import { z } from 'zod';

import { enqueueAuditEvent } from '../audit/audit.service';
import {
  authStepUp,
  authSessions,
  db,
  mfaFactors,
  mfaRecoveryCodes,
  outboxEvents,
  users,
} from '../db';
import { AuthRepository } from '../repositories/auth-repository';
import { RbacRepository } from '../repositories/rbac-repository';
import { RateLimiter } from '../services/rate-limiter';

import { publicProcedure, protectedProcedure, router } from './index';

const authRepo = new AuthRepository(db);
const rbacRepo = new RbacRepository(db);
const authService = new AuthDomainService(authRepo, process.env.JWT_SECRET || 'dev-secret-change-in-production');
const rbacService = new RbacDomainService(rbacRepo);
const rateLimiter = new RateLimiter(db);

export const authRouter = router({
  /**
   * Register a new user and organization
   */
  register: publicProcedure
    .input(registerSchema)
    .output(authTokenResponseSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ulid();
        const orgId = ulid();

        // Register user
        await authService.register(
          userId,
          orgId,
          input.email,
          input.password,
          input.name,
          input.orgName
        );

        // Bootstrap default RBAC roles
        const ownerRoleId = ulid();
        const assignmentId = ulid();
        await rbacService.bootstrapDefaultOrgRoles(ownerRoleId, assignmentId, orgId, userId);

        // Create email verification token
        const verificationToken = await authService.createEmailVerificationToken(userId);

        // Emit email verification event
        const verificationEvent = createEmailVerificationRequested(
          orgId,
          { userId, email: input.email, token: verificationToken },
          ctx.correlationId
        );

        const outboxRecord: InferInsertModel<typeof outboxEvents> = {
          id: ulid(),
          eventId: verificationEvent.eventId,
          eventType: verificationEvent.eventType,
          eventVersion: verificationEvent.eventVersion,
          tenantId: verificationEvent.tenantId ?? orgId,
          correlationId: verificationEvent.correlationId,
          payload: verificationEvent.payload as unknown as Record<string, unknown>,
          occurredAt: verificationEvent.occurredAt,
        };
        await db.insert(outboxEvents).values(outboxRecord);

        // Login immediately after registration
        const loginResult = await authService.login(input.email, input.password, ctx.ip, ctx.userAgent);

        // Audit: Registration
        const auditEvent = buildAuditEvent({
          eventType: AuditEventTypes.AUTH_LOGIN_SUCCESS,
          tenantId: orgId,
          actor: buildUserActor(userId, input.email),
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
          correlationId: ctx.correlationId,
          resourceType: 'User',
          resourceId: userId,
          action: 'REGISTER',
          status: 'SUCCESS',
          dataTag: {
            classification: DataClassifications.CONFIDENTIAL,
            categories: [DataCategories.AUTH, DataCategories.IDENTITY],
          },
        });

        await enqueueAuditEvent(db, auditEvent);

        return {
          accessToken: loginResult.accessToken,
          refreshToken: loginResult.refreshToken,
          expiresIn: loginResult.expiresIn,
        };
      } catch (error) {
        // Audit: Registration failure
        const auditEvent = buildAuditEvent({
          eventType: AuditEventTypes.AUTH_LOGIN_FAILURE,
          actor: { type: 'SYSTEM', display: input.email },
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
          correlationId: ctx.correlationId,
          action: 'REGISTER',
          status: 'FAILURE',
          reason: (error as Error).message,
          dataTag: {
            classification: DataClassifications.CONFIDENTIAL,
            categories: [DataCategories.AUTH],
          },
        });

        await enqueueAuditEvent(db, auditEvent);

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: (error as Error).message,
        });
      }
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(loginSchema)
    .output(authTokenResponseSchema)
    .mutation(async ({ input, ctx }) => {
      // Rate limit login attempts
      const rateLimitKey = `login:${input.email}`;
      try {
        await rateLimiter.checkRateLimit(rateLimitKey, 5, 900); // 5 attempts per 15 minutes
      } catch (error) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many login attempts. Please try again later.',
        });
      }

      try {
        const result = await authService.login(input.email, input.password, ctx.ip, ctx.userAgent);

        // Clear rate limit on successful login
        await rateLimiter.clearRateLimit(rateLimitKey);

        // Audit: Login success
        const auditEvent = buildAuditEvent({
          eventType: AuditEventTypes.AUTH_LOGIN_SUCCESS,
          tenantId: result.orgId,
          actor: buildUserActor(result.userId, input.email),
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
          correlationId: ctx.correlationId,
          resourceType: 'Session',
          resourceId: result.sessionId,
          action: 'LOGIN',
          status: 'SUCCESS',
          dataTag: {
            classification: DataClassifications.RESTRICTED,
            categories: [DataCategories.AUTH],
          },
        });

        await enqueueAuditEvent(db, auditEvent);

        return {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        };
      } catch (error) {
        // Audit: Login failure
        const auditEvent = buildAuditEvent({
          eventType: AuditEventTypes.AUTH_LOGIN_FAILURE,
          actor: { type: 'SYSTEM', display: input.email },
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
          correlationId: ctx.correlationId,
          action: 'LOGIN',
          status: 'FAILURE',
          reason: (error as Error).message,
          dataTag: {
            classification: DataClassifications.RESTRICTED,
            categories: [DataCategories.AUTH],
          },
        });

        await enqueueAuditEvent(db, auditEvent);

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }
    }),

  /**
   * Refresh access token
   */
  refresh: publicProcedure
    .input(refreshTokenSchema)
    .output(authTokenResponseSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await authService.refresh(input.refreshToken);
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: (error as Error).message,
        });
      }
    }),

  /**
   * Logout
   */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const auth = requireUserAuth(ctx);

    if (auth.sessionId) {
      await authService.logout(auth.sessionId);

      // Audit: Logout
      const auditEvent = buildAuditEvent({
        eventType: AuditEventTypes.AUTH_LOGOUT,
        tenantId: auth.orgId,
        actor: buildUserActor(auth.userId),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        resourceType: 'Session',
        resourceId: auth.sessionId,
        action: 'LOGOUT',
        status: 'SUCCESS',
        dataTag: {
          classification: DataClassifications.CONFIDENTIAL,
          categories: [DataCategories.AUTH],
        },
      });

      await enqueueAuditEvent(db, auditEvent);
    }

    return { success: true };
  }),

  /**
   * Request email verification
   */
  requestEmailVerification: protectedProcedure
    .input(requestEmailVerificationSchema)
    .mutation(async ({ ctx }) => {
      const auth = requireUserAuth(ctx);

      const verificationToken = await authService.createEmailVerificationToken(auth.userId);

      // Get user email
      const userResults = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
      if (userResults.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const verificationEvent = createEmailVerificationRequested(
        auth.orgId,
        { userId: auth.userId, email: userResults[0].email, token: verificationToken },
        ctx.correlationId
      );

      const outboxRecord: InferInsertModel<typeof outboxEvents> = {
        id: ulid(),
        eventId: verificationEvent.eventId,
        eventType: verificationEvent.eventType,
        eventVersion: verificationEvent.eventVersion,
        tenantId: verificationEvent.tenantId ?? auth.orgId,
        correlationId: verificationEvent.correlationId,
        payload: verificationEvent.payload as unknown as Record<string, unknown>,
        occurredAt: verificationEvent.occurredAt,
      };
      await db.insert(outboxEvents).values(outboxRecord);

      return { success: true };
    }),

  /**
   * Verify email
   */
  verifyEmail: publicProcedure.input(verifyEmailSchema).mutation(async ({ input, ctx }) => {
    try {
      const result = await authService.verifyEmail(input.token);

      // Audit: Email verification
      const auditEvent = buildAuditEvent({
        eventType: 'auth.email.verified',
        actor: buildUserActor(result.userId),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        resourceType: 'User',
        resourceId: result.userId,
        action: 'VERIFY_EMAIL',
        status: 'SUCCESS',
        dataTag: {
          classification: DataClassifications.CONFIDENTIAL,
          categories: [DataCategories.IDENTITY],
        },
      });

      await enqueueAuditEvent(db, auditEvent);

      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: (error as Error).message,
      });
    }
  }),

  /**
   * List user sessions
   */
  listSessions: protectedProcedure.output(listSessionsResponseSchema).query(async ({ ctx }) => {
    const auth = requireUserAuth(ctx);

    const sessions = await db
      .select()
      .from(authSessions)
      .where(and(eq(authSessions.userId, auth.userId), isNull(authSessions.revokedAt)))
      .orderBy(authSessions.lastSeenAt);

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt.toISOString(),
        lastSeenAt: s.lastSeenAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        ip: s.ip || undefined,
        userAgent: s.userAgent || undefined,
        deviceLabel: s.deviceLabel || undefined,
        isCurrent: s.id === auth.sessionId,
      })),
    };
  }),

  /**
   * Revoke a session
   */
  revokeSession: protectedProcedure.input(revokeSessionSchema).mutation(async ({ input, ctx }) => {
    const auth = requireUserAuth(ctx);

    // Verify session belongs to user
    const sessions = await db
      .select()
      .from(authSessions)
      .where(and(eq(authSessions.id, input.sessionId), eq(authSessions.userId, auth.userId)))
      .limit(1);

    if (sessions.length === 0) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
    }

    await authService.logout(input.sessionId);

    // Audit
    const auditEvent = buildAuditEvent({
      eventType: AuditEventTypes.AUTH_LOGOUT,
      tenantId: auth.orgId,
      actor: buildUserActor(auth.userId),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      resourceType: 'Session',
      resourceId: input.sessionId,
      action: 'REVOKE_SESSION',
      status: 'SUCCESS',
      dataTag: {
        classification: DataClassifications.CONFIDENTIAL,
        categories: [DataCategories.AUTH],
      },
    });

    await enqueueAuditEvent(db, auditEvent);

    return { success: true };
  }),

  /**
   * Enroll MFA (TOTP)
   */
  enrollMfa: protectedProcedure
    .input(enrollMfaSchema)
    .output(enrollMfaResponseSchema)
    .mutation(async ({ ctx }) => {
      const auth = requireUserAuth(ctx);

      // Get user email
      const userResults = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
      if (userResults.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Generate TOTP secret
      const secret = generateTotpSecret();
      const qrCodeUri = generateQrCodeUri(secret, userResults[0].email);

      // Encrypt secret for storage
      const mfaKey = process.env.MFA_ENCRYPTION_KEY || 'dev-mfa-key-change-in-production';
      const secretEncrypted = encryptString(secret, mfaKey);

      // Store unverified factor
      await db.insert(mfaFactors).values({
        id: ulid(),
        userId: auth.userId,
        type: 'TOTP',
        secretEncrypted,
        verifiedAt: null, // Not verified until user proves they can generate codes
      });

      // Audit
      const auditEvent = buildAuditEvent({
        eventType: AuditEventTypes.AUTH_MFA_ENROLL,
        tenantId: auth.orgId,
        actor: buildUserActor(auth.userId),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        action: 'MFA_ENROLL_INIT',
        status: 'SUCCESS',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.AUTH],
        },
      });

      await enqueueAuditEvent(db, auditEvent);

      return {
        secret, // Show once for QR code
        qrCodeUri,
      };
    }),

  /**
   * Verify MFA enrollment
   */
  verifyMfaEnrollment: protectedProcedure
    .input(verifyMfaEnrollmentSchema)
    .mutation(async ({ input, ctx }) => {
      const auth = requireUserAuth(ctx);

      // Get unverified factor
      const factors = await db
        .select()
        .from(mfaFactors)
        .where(and(eq(mfaFactors.userId, auth.userId), isNull(mfaFactors.verifiedAt), isNull(mfaFactors.disabledAt)))
        .limit(1);

      if (factors.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No pending MFA enrollment found' });
      }

      // Decrypt secret
      const mfaKey = process.env.MFA_ENCRYPTION_KEY || 'dev-mfa-key-change-in-production';
      const secret = decryptString(factors[0].secretEncrypted, mfaKey);

      // Verify code
      if (!verifyTotp(secret, input.code)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid code' });
      }

      // Mark as verified
      await db
        .update(mfaFactors)
        .set({ verifiedAt: new Date() })
        .where(eq(mfaFactors.id, factors[0].id));

      // Audit
      const auditEvent = buildAuditEvent({
        eventType: AuditEventTypes.AUTH_MFA_ENROLL,
        tenantId: auth.orgId,
        actor: buildUserActor(auth.userId),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        action: 'MFA_ENROLL_COMPLETE',
        status: 'SUCCESS',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.AUTH],
        },
      });

      await enqueueAuditEvent(db, auditEvent);

      return { success: true };
    }),

  /**
   * Generate recovery codes
   */
  generateRecoveryCodes: protectedProcedure
    .input(generateRecoveryCodesSchema)
    .output(generateRecoveryCodesResponseSchema)
    .mutation(async ({ ctx }) => {
      const auth = requireUserAuth(ctx);

      // Check if MFA is enrolled
      const factors = await db
        .select()
        .from(mfaFactors)
        .where(and(eq(mfaFactors.userId, auth.userId), isNull(mfaFactors.disabledAt)))
        .limit(1);

      if (factors.length === 0 || !factors[0].verifiedAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'MFA must be enrolled first' });
      }

      // Generate codes
      const { plain, hashed } = generateRecoveryCodes(10);

      // Store hashed codes
      await db.insert(mfaRecoveryCodes).values(
        hashed.map((codeHash) => ({
          id: ulid(),
          userId: auth.userId,
          codeHash,
        }))
      );

      // Audit
      const auditEvent = buildAuditEvent({
        eventType: 'auth.mfa.recovery_codes_generated',
        tenantId: auth.orgId,
        actor: buildUserActor(auth.userId),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        action: 'RECOVERY_CODES_GENERATED',
        status: 'SUCCESS',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.AUTH],
        },
        metadata: { count: plain.length },
      });

      await enqueueAuditEvent(db, auditEvent);

      return { codes: plain }; // Show once
    }),

  /**
   * Verify MFA (TOTP or recovery code)
   */
  verifyMfa: protectedProcedure.input(verifyMfaSchema).mutation(async ({ input, ctx }) => {
    const auth = requireUserAuth(ctx);

    // Get verified factor
    const factors = await db
      .select()
      .from(mfaFactors)
      .where(and(eq(mfaFactors.userId, auth.userId), isNull(mfaFactors.disabledAt)))
      .limit(1);

    if (factors.length === 0 || !factors[0].verifiedAt) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'MFA not enrolled' });
    }

    let verified = false;
    let method = 'TOTP';

    // Try TOTP first
    const mfaKey = process.env.MFA_ENCRYPTION_KEY || 'dev-mfa-key-change-in-production';
    const secret = decryptString(factors[0].secretEncrypted, mfaKey);
    verified = verifyTotp(secret, input.code);

    // If TOTP fails, try recovery codes
    if (!verified) {
      const recoveryCodes = await db
        .select()
        .from(mfaRecoveryCodes)
        .where(and(eq(mfaRecoveryCodes.userId, auth.userId), isNull(mfaRecoveryCodes.usedAt)));

      for (const rc of recoveryCodes) {
        if (verifyRecoveryCode(input.code, rc.codeHash)) {
          verified = true;
          method = 'RECOVERY_CODE';

          // Mark recovery code as used
          await db
            .update(mfaRecoveryCodes)
            .set({ usedAt: new Date() })
            .where(eq(mfaRecoveryCodes.id, rc.id));

          break;
        }
      }
    }

    if (!verified) {
      // Audit failure
      const auditEvent = buildAuditEvent({
        eventType: AuditEventTypes.AUTH_MFA_VERIFY_FAILURE,
        tenantId: auth.orgId,
        actor: buildUserActor(auth.userId),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        action: 'MFA_VERIFY',
        status: 'FAILURE',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.AUTH],
        },
      });

      await enqueueAuditEvent(db, auditEvent);

      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid code' });
    }

    // Audit success
    const auditEvent = buildAuditEvent({
      eventType: AuditEventTypes.AUTH_MFA_VERIFY_SUCCESS,
      tenantId: auth.orgId,
      actor: buildUserActor(auth.userId),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      action: 'MFA_VERIFY',
      status: 'SUCCESS',
      dataTag: {
        classification: DataClassifications.RESTRICTED,
        categories: [DataCategories.AUTH],
      },
      metadata: { method },
    });

    await enqueueAuditEvent(db, auditEvent);

    return { success: true, method };
  }),

  /**
   * Step-up authentication (re-authenticate for sensitive actions)
   */
  stepUp: protectedProcedure.input(stepUpSchema).mutation(async ({ input, ctx }) => {
    const auth = requireUserAuth(ctx);

    if (!auth.sessionId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No active session' });
    }

    let verified = false;

    if (input.method === 'password') {
      // Verify password
      const userResults = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
      if (userResults.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const { verifyPassword } = await import('@serp/core');
      verified = await verifyPassword(input.credential, userResults[0].passwordHash);
    } else if (input.method === 'mfa') {
      // Verify MFA
      const factors = await db
        .select()
        .from(mfaFactors)
        .where(and(eq(mfaFactors.userId, auth.userId), isNull(mfaFactors.disabledAt)))
        .limit(1);

      if (factors.length > 0 && factors[0].verifiedAt) {
        const mfaKey = process.env.MFA_ENCRYPTION_KEY || 'dev-mfa-key-change-in-production';
        const secret = decryptString(factors[0].secretEncrypted, mfaKey);
        verified = verifyTotp(secret, input.credential);
      }
    }

    if (!verified) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    // Create step-up record (valid for 15 minutes)
    await db.insert(authStepUp).values({
      id: ulid(),
      sessionId: auth.sessionId,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      method: input.method.toUpperCase(),
    });

    // Audit
    const auditEvent = buildAuditEvent({
      eventType: 'auth.step_up.verified',
      tenantId: auth.orgId,
      actor: buildUserActor(auth.userId),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      action: 'STEP_UP',
      status: 'SUCCESS',
      dataTag: {
        classification: DataClassifications.RESTRICTED,
        categories: [DataCategories.AUTH],
      },
      metadata: { method: input.method },
    });

    await enqueueAuditEvent(db, auditEvent);

    return { success: true, expiresIn: 900 }; // 15 minutes
  }),

  /**
   * Disable MFA
   */
  disableMfa: protectedProcedure.input(disableMfaSchema).mutation(async ({ input, ctx }) => {
    const auth = requireUserAuth(ctx);

    // Get verified factor
    const factors = await db
      .select()
      .from(mfaFactors)
      .where(and(eq(mfaFactors.userId, auth.userId), isNull(mfaFactors.disabledAt)))
      .limit(1);

    if (factors.length === 0 || !factors[0].verifiedAt) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'MFA not enrolled' });
    }

    // Verify MFA code before disabling (security check)
    const mfaKey = process.env.MFA_ENCRYPTION_KEY || 'dev-mfa-key-change-in-production';
    const secret = decryptString(factors[0].secretEncrypted, mfaKey);

    if (!verifyTotp(secret, input.code)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid code' });
    }

    // Disable factor
    await db.update(mfaFactors).set({ disabledAt: new Date() }).where(eq(mfaFactors.id, factors[0].id));

    // Audit
    const auditEvent = buildAuditEvent({
      eventType: AuditEventTypes.AUTH_MFA_RESET,
      tenantId: auth.orgId,
      actor: buildUserActor(auth.userId),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      action: 'MFA_DISABLE',
      status: 'SUCCESS',
      dataTag: {
        classification: DataClassifications.RESTRICTED,
        categories: [DataCategories.AUTH],
      },
    });

    await enqueueAuditEvent(db, auditEvent);

    return { success: true };
  }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure.input(requestPasswordResetSchema).mutation(async ({ input, ctx }) => {
    // Rate limit password reset requests
    const rateLimitKey = `password_reset:${input.email}`;
    try {
      await rateLimiter.checkRateLimit(rateLimitKey, 3, 900); // 3 attempts per 15 minutes
    } catch (error) {
      // Return success anyway (non-enumerable)
      return { success: true };
    }

    try {
      // Find user by email (don't reveal if user exists)
      const userResults = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      if (userResults.length > 0) {
        const user = userResults[0];

        // Create password reset token
        const resetToken = await authService.createPasswordResetToken(user.id);

        // Emit password reset event
        const resetEvent = createPasswordResetRequested(
          'system', // No tenantId available for public endpoint
          { userId: user.id, email: user.email, token: resetToken },
          ctx.correlationId
        );

        const outboxRecord: InferInsertModel<typeof outboxEvents> = {
          id: ulid(),
          eventId: resetEvent.eventId,
          eventType: resetEvent.eventType,
          eventVersion: resetEvent.eventVersion,
          tenantId: resetEvent.tenantId ?? 'system',
          correlationId: resetEvent.correlationId,
          payload: resetEvent.payload as unknown as Record<string, unknown>,
          occurredAt: resetEvent.occurredAt,
        };
        await db.insert(outboxEvents).values(outboxRecord);
      }

      // Always return success (non-enumerable)
      return { success: true };
    } catch (error) {
      // Generic error (non-enumerable)
      return { success: true };
    }
  }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure.input(resetPasswordSchema).mutation(async ({ input, ctx }) => {
    try {
      const result = await authService.resetPassword(input.token, input.newPassword);

      // Audit
      const auditEvent = buildAuditEvent({
        eventType: 'auth.password.reset',
        actor: buildUserActor(result.userId),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        resourceType: 'User',
        resourceId: result.userId,
        action: 'RESET_PASSWORD',
        status: 'SUCCESS',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.AUTH],
        },
      });

      await enqueueAuditEvent(db, auditEvent);

      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid or expired reset token',
      });
    }
  }),

  /**
   * Request magic link (passwordless login)
   */
  requestMagicLink: publicProcedure.input(requestMagicLinkSchema).mutation(async ({ input, ctx }) => {
    // Rate limit magic link requests
    const rateLimitKey = `magic_link:${input.email}`;
    try {
      await rateLimiter.checkRateLimit(rateLimitKey, 3, 900); // 3 attempts per 15 minutes
    } catch (error) {
      // Return success anyway (non-enumerable)
      return { success: true };
    }

    try {
      // Find user by email (don't reveal if user exists)
      const userResults = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      if (userResults.length > 0) {
        const user = userResults[0];

        // Create magic link token
        const magicToken = await authService.createMagicLinkToken(user.id);

        // Emit magic link event
        const magicEvent = createMagicLinkRequested(
          'system',
          { userId: user.id, email: user.email, token: magicToken },
          ctx.correlationId
        );

        const outboxRecord: InferInsertModel<typeof outboxEvents> = {
          id: ulid(),
          eventId: magicEvent.eventId,
          eventType: magicEvent.eventType,
          eventVersion: magicEvent.eventVersion,
          tenantId: magicEvent.tenantId ?? 'system',
          correlationId: magicEvent.correlationId,
          payload: magicEvent.payload as unknown as Record<string, unknown>,
          occurredAt: magicEvent.occurredAt,
        };
        await db.insert(outboxEvents).values(outboxRecord);
      }

      // Always return success (non-enumerable)
      return { success: true };
    } catch (error) {
      return { success: true };
    }
  }),

  /**
   * Consume magic link
   */
  consumeMagicLink: publicProcedure
    .input(consumeMagicLinkSchema)
    .output(authTokenResponseSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await authService.consumeMagicLink(input.token, ctx.ip, ctx.userAgent);

        // Audit
        const auditEvent = buildAuditEvent({
          eventType: AuditEventTypes.AUTH_LOGIN_SUCCESS,
          tenantId: result.orgId,
          actor: buildUserActor(result.userId),
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
          correlationId: ctx.correlationId,
          resourceType: 'Session',
          resourceId: result.sessionId,
          action: 'MAGIC_LINK_LOGIN',
          status: 'SUCCESS',
          dataTag: {
            classification: DataClassifications.RESTRICTED,
            categories: [DataCategories.AUTH],
          },
        });

        await enqueueAuditEvent(db, auditEvent);

        return {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired magic link',
        });
      }
    }),

  /**
   * Request OTP code
   */
  requestOtp: publicProcedure.input(requestOtpSchema).mutation(async ({ input, ctx }) => {
    // Rate limit OTP requests
    const rateLimitKey = `otp:${input.email}:${input.purpose}`;
    try {
      await rateLimiter.checkRateLimit(rateLimitKey, 3, 900); // 3 attempts per 15 minutes
    } catch (error) {
      // Return success anyway (non-enumerable)
      return { success: true };
    }

    try {
      // Find user by email (don't reveal if user exists)
      const userResults = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      if (userResults.length > 0) {
        const user = userResults[0];

        // Create OTP code
        const otpCode = await authService.createOtpCode(user.id, input.purpose);

        // Emit OTP event
        const otpEvent = createOtpRequested(
          'system',
          { userId: user.id, email: user.email, code: otpCode, purpose: input.purpose },
          ctx.correlationId
        );

        const outboxRecord: InferInsertModel<typeof outboxEvents> = {
          id: ulid(),
          eventId: otpEvent.eventId,
          eventType: otpEvent.eventType,
          eventVersion: otpEvent.eventVersion,
          tenantId: otpEvent.tenantId ?? 'system',
          correlationId: otpEvent.correlationId,
          payload: otpEvent.payload as unknown as Record<string, unknown>,
          occurredAt: otpEvent.occurredAt,
        };
        await db.insert(outboxEvents).values(outboxRecord);
      }

      // Always return success (non-enumerable)
      return { success: true };
    } catch (error) {
      return { success: true };
    }
  }),

  /**
   * Verify OTP code
   */
  verifyOtp: publicProcedure
    .input(verifyOtpSchema)
    .output(
      z.union([
        authTokenResponseSchema,
        z.object({
          success: z.literal(true),
        }),
      ])
    )
    .mutation(async ({ input, ctx }) => {
    try {
      // Find user by email
      const userResults = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      if (userResults.length === 0) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid code' });
      }

      const user = userResults[0];

      // Verify OTP
      const result = await authService.verifyOtpCode(user.id, input.code, input.purpose, ctx.ip, ctx.userAgent);

      if ('success' in result) {
        // Non-login purpose (just verification); align to expected return shape
        return { success: true };
      }

      // Login purpose - return tokens
      const auditEvent = buildAuditEvent({
        eventType: AuditEventTypes.AUTH_LOGIN_SUCCESS,
        tenantId: result.orgId,
        actor: buildUserActor(result.userId),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        resourceType: 'Session',
        resourceId: result.sessionId,
        action: 'OTP_LOGIN',
        status: 'SUCCESS',
        dataTag: {
          classification: DataClassifications.RESTRICTED,
          categories: [DataCategories.AUTH],
        },
      });

      await enqueueAuditEvent(db, auditEvent);

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired code',
      });
    }
  }),
});
