/**
 * Auth domain service (business logic)
 * Pure domain logic - no infrastructure dependencies
 */

import { ulid } from 'ulid';

import type { IAuthRepository } from './types';
import { generateSecureToken, hashPassword, hashToken, verifyPassword } from '../../auth/crypto';
import { TokenService } from '../../auth/token-service';

export interface RegisterResult {
  userId: string;
  orgId: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  orgId: string;
  sessionId: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthDomainService {
  private tokenService: TokenService;

  constructor(
    private authRepo: IAuthRepository,
    jwtSecret: string
  ) {
    this.tokenService = new TokenService(jwtSecret);
  }

  /**
   * Register a new user and create their organization
   */
  async register(
    userId: string,
    orgId: string,
    email: string,
    password: string,
    name: string,
    orgName: string
  ): Promise<RegisterResult> {
    // Check if user exists
    const existingUser = await this.authRepo.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await hashPassword(password);

    // Create user
    await this.authRepo.createUser({
      id: userId,
      email,
      passwordHash,
      name,
    });

    // Create org
    await this.authRepo.createOrg({
      id: orgId,
      name: orgName,
    });

    // Create membership
    const membershipId = this.generateId();
    await this.authRepo.createOrgMembership({
      id: membershipId,
      userId,
      orgId,
    });

    return { userId, orgId };
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string, ip?: string, userAgent?: string): Promise<LoginResult> {
    // Find user
    const user = await this.authRepo.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is temporarily locked');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      // Increment failed login count
      await this.authRepo.updateUser(user.id, {
        failedLoginCount: user.failedLoginCount + 1,
        lockedUntil: user.failedLoginCount + 1 >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      });

      throw new Error('Invalid credentials');
    }

    // Reset failed login count
    await this.authRepo.updateUser(user.id, {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    // Get user's first org
    let memberships = await this.authRepo.getOrgMemberships(user.id);
    
    // Recovery: If no membership found, try to recover from orphaned state
    // This handles cases where registration partially succeeded before generateId() was fixed
    if (memberships.length === 0) {
      // Try to find orgs that might belong to this user
      const candidateOrgs = await this.authRepo.findOrgsForRecovery(user.id);
      
      if (candidateOrgs.length > 0) {
        // Create membership for the first candidate org
        const orgId = candidateOrgs[0].id;
        const membershipId = this.generateId();
        await this.authRepo.createOrgMembership({
          id: membershipId,
          userId: user.id,
          orgId,
        });
        
        // Re-fetch memberships
        memberships = await this.authRepo.getOrgMemberships(user.id);
      }
    }
    
    if (memberships.length === 0) {
      throw new Error('No organization membership found. Please contact support to restore your account access.');
    }

    const orgId = memberships[0].orgId;

    // Create session
    const sessionId = this.generateId();
    const familyId = this.generateId();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

    await this.authRepo.createSession({
      id: sessionId,
      userId: user.id,
      activeOrgId: orgId,
      expiresAt,
      ip,
      userAgent,
    });

    // Create refresh token
    const refreshToken = generateSecureToken();
    const refreshTokenHash = hashToken(refreshToken);

    await this.authRepo.createRefreshToken({
      id: this.generateId(),
      sessionId,
      tokenHash: refreshTokenHash,
      familyId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Create access token
    const accessToken = this.tokenService.createUserAccessToken(user.id, orgId, sessionId, 900); // 15 min

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      userId: user.id,
      orgId,
      sessionId,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(refreshTokenValue: string): Promise<RefreshResult> {
    const tokenHash = hashToken(refreshTokenValue);

    // Find refresh token
    const token = await this.authRepo.getRefreshTokenByHash(tokenHash);
    if (!token) {
      throw new Error('Invalid refresh token');
    }

    // Check if revoked
    if (token.revokedAt) {
      throw new Error('Refresh token revoked');
    }

    // Check if expired
    if (token.expiresAt < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Check if already rotated (reuse detection)
    if (token.rotatedAt) {
      // Revoke entire family
      await this.authRepo.revokeRefreshTokenFamily(token.familyId);
      throw new Error('Refresh token already used - family revoked');
    }

    // Get session
    const session = await this.authRepo.getSessionById(token.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if session revoked or expired
    if (session.revokedAt) {
      throw new Error('Session revoked');
    }

    if (session.expiresAt < new Date()) {
      throw new Error('Session expired');
    }

    // Mark old token as rotated
    await this.authRepo.updateRefreshToken(token.id, { rotatedAt: new Date() });

    // Create new refresh token
    const newRefreshToken = generateSecureToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await this.authRepo.createRefreshToken({
      id: this.generateId(),
      sessionId: session.id,
      tokenHash: newRefreshTokenHash,
      familyId: token.familyId, // Same family
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Update session last seen
    await this.authRepo.updateSession(session.id, { lastSeenAt: new Date() });

    // Create new access token
    const newAccessToken = this.tokenService.createUserAccessToken(
      session.userId,
      session.activeOrgId || '',
      session.id,
      900
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }

  /**
   * Logout (revoke session)
   */
  async logout(sessionId: string): Promise<void> {
    await this.authRepo.updateSession(sessionId, { revokedAt: new Date() });
    await this.authRepo.revokeSessionRefreshTokens(sessionId);
  }

  /**
   * Create email verification token
   */
  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = generateSecureToken();
    const tokenHash = hashToken(token);

    await this.authRepo.createEmailVerificationToken({
      id: this.generateId(),
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    return token;
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<{ userId: string }> {
    const tokenHash = hashToken(token);

    const verificationToken = await this.authRepo.getEmailVerificationTokenByHash(tokenHash);
    if (!verificationToken) {
      throw new Error('Invalid verification token');
    }

    if (verificationToken.usedAt) {
      throw new Error('Verification token already used');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new Error('Verification token expired');
    }

    // Mark token as used and update user
    await this.authRepo.updateEmailVerificationToken(verificationToken.id, { usedAt: new Date() });
    await this.authRepo.updateUser(verificationToken.userId, { emailVerifiedAt: new Date() });

    return { userId: verificationToken.userId };
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(userId: string): Promise<string> {
    const token = generateSecureToken();
    const tokenHash = hashToken(token);

    await this.authRepo.createPasswordResetToken({
      id: this.generateId(),
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    return token;
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ userId: string }> {
    const tokenHash = hashToken(token);

    const resetToken = await this.authRepo.getPasswordResetTokenByHash(tokenHash);
    if (!resetToken) {
      throw new Error('Invalid reset token');
    }

    if (resetToken.usedAt) {
      throw new Error('Reset token already used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new Error('Reset token expired');
    }

    // Mark token as used and update password
    const passwordHash = await hashPassword(newPassword);
    await this.authRepo.updatePasswordResetToken(resetToken.id, { usedAt: new Date() });
    await this.authRepo.updateUser(resetToken.userId, { passwordHash });

    return { userId: resetToken.userId };
  }

  /**
   * Create magic link token
   */
  async createMagicLinkToken(userId: string): Promise<string> {
    const token = generateSecureToken();
    const tokenHash = hashToken(token);

    await this.authRepo.createMagicLinkToken({
      id: this.generateId(),
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    return token;
  }

  /**
   * Consume magic link and create session
   */
  async consumeMagicLink(token: string, ip?: string, userAgent?: string): Promise<LoginResult> {
    const tokenHash = hashToken(token);

    const magicToken = await this.authRepo.getMagicLinkTokenByHash(tokenHash);
    if (!magicToken) {
      throw new Error('Invalid magic link');
    }

    if (magicToken.usedAt) {
      throw new Error('Magic link already used');
    }

    if (magicToken.expiresAt < new Date()) {
      throw new Error('Magic link expired');
    }

    // Mark token as used
    await this.authRepo.updateMagicLinkToken(magicToken.id, { usedAt: new Date() });

    // Get user
    const user = await this.authRepo.getUserById(magicToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's first org
    let memberships = await this.authRepo.getOrgMemberships(user.id);
    
    // Recovery: If no membership found, try to recover from orphaned state
    if (memberships.length === 0) {
      const candidateOrgs = await this.authRepo.findOrgsForRecovery(user.id);
      if (candidateOrgs.length > 0) {
        const orgId = candidateOrgs[0].id;
        const membershipId = this.generateId();
        await this.authRepo.createOrgMembership({
          id: membershipId,
          userId: user.id,
          orgId,
        });
        memberships = await this.authRepo.getOrgMemberships(user.id);
      }
    }
    
    if (memberships.length === 0) {
      throw new Error('No organization membership found. Please contact support to restore your account access.');
    }

    const orgId = memberships[0].orgId;

    // Create session (same as login)
    const sessionId = this.generateId();
    const familyId = this.generateId();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

    await this.authRepo.createSession({
      id: sessionId,
      userId: user.id,
      activeOrgId: orgId,
      expiresAt,
      ip,
      userAgent,
    });

    // Create refresh token
    const refreshToken = generateSecureToken();
    const refreshTokenHash = hashToken(refreshToken);

    await this.authRepo.createRefreshToken({
      id: this.generateId(),
      sessionId,
      tokenHash: refreshTokenHash,
      familyId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Create access token
    const accessToken = this.tokenService.createUserAccessToken(user.id, orgId, sessionId, 900);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      userId: user.id,
      orgId,
      sessionId,
    };
  }

  /**
   * Create OTP code
   */
  async createOtpCode(userId: string, purpose: 'LOGIN' | 'VERIFICATION' | 'MFA'): Promise<string> {
    const code = this.generateOtpCode();
    const codeHash = hashToken(code);

    await this.authRepo.createOtpCode({
      id: this.generateId(),
      userId,
      codeHash,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    return code;
  }

  /**
   * Verify OTP code and create session
   */
  async verifyOtpCode(
    userId: string,
    code: string,
    purpose: 'LOGIN' | 'VERIFICATION' | 'MFA',
    ip?: string,
    userAgent?: string
  ): Promise<LoginResult | { success: true }> {
    const codeHash = hashToken(code);

    const otpCodes = await this.authRepo.getOtpCodesByUser(userId, purpose);

    let validCode = null;
    for (const otp of otpCodes) {
      if (!otp.usedAt && otp.expiresAt > new Date() && otp.codeHash === codeHash) {
        validCode = otp;
        break;
      }
    }

    if (!validCode) {
      throw new Error('Invalid or expired OTP code');
    }

    // Mark code as used
    await this.authRepo.updateOtpCode(validCode.id, { usedAt: new Date() });

    // If purpose is LOGIN, create session
    if (purpose === 'LOGIN') {
      const user = await this.authRepo.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let memberships = await this.authRepo.getOrgMemberships(user.id);
      
      // Recovery: If no membership found, try to recover from orphaned state
      if (memberships.length === 0) {
        const candidateOrgs = await this.authRepo.findOrgsForRecovery(user.id);
        if (candidateOrgs.length > 0) {
          const orgId = candidateOrgs[0].id;
          const membershipId = this.generateId();
          await this.authRepo.createOrgMembership({
            id: membershipId,
            userId: user.id,
            orgId,
          });
          memberships = await this.authRepo.getOrgMemberships(user.id);
        }
      }
      
      if (memberships.length === 0) {
        throw new Error('No organization membership found. Please contact support to restore your account access.');
      }

      const orgId = memberships[0].orgId;

      const sessionId = this.generateId();
      const familyId = this.generateId();
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

      await this.authRepo.createSession({
        id: sessionId,
        userId: user.id,
        activeOrgId: orgId,
        expiresAt,
        ip,
        userAgent,
      });

      const refreshToken = generateSecureToken();
      const refreshTokenHash = hashToken(refreshToken);

      await this.authRepo.createRefreshToken({
        id: this.generateId(),
        sessionId,
        tokenHash: refreshTokenHash,
        familyId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const accessToken = this.tokenService.createUserAccessToken(user.id, orgId, sessionId, 900);

      return {
        accessToken,
        refreshToken,
        expiresIn: 900,
        userId: user.id,
        orgId,
        sessionId,
      };
    }

    return { success: true };
  }

  /**
   * Generate a ULID (Universally Unique Lexicographically Sortable Identifier)
   * ULIDs are used for all entity IDs in the system as they are:
   * - Sortable by creation time
   * - URL-safe
   * - Collision-resistant
   * - Time-ordered (useful for database indexing)
   */
  private generateId(): string {
    return ulid();
  }

  private generateOtpCode(): string {
    // Generate 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
