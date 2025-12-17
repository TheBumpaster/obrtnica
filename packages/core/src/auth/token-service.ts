import { JwtService } from './jwt';

export interface ValidatedSession {
  userId: string;
  orgId: string;
  sessionId: string;
  type: 'user';
}

export interface ValidatedServiceAccount {
  serviceAccountId: string;
  orgId: string;
  type: 'service';
}

export type ValidatedPrincipal = ValidatedSession | ValidatedServiceAccount;

export class TokenService {
  private jwtService: JwtService;

  constructor(jwtSecret: string) {
    this.jwtService = new JwtService(jwtSecret);
  }

  /**
   * Create an access token for a user session
   */
  createUserAccessToken(userId: string, orgId: string, sessionId: string, expiresInSeconds = 900): string {
    return this.jwtService.sign(
      {
        sub: userId,
        type: 'user',
        orgId,
        sessionId,
      },
      expiresInSeconds
    );
  }

  /**
   * Create an access token for a service account
   */
  createServiceAccessToken(serviceAccountId: string, orgId: string, expiresInSeconds = 3600): string {
    return this.jwtService.sign(
      {
        sub: serviceAccountId,
        type: 'service',
        orgId,
      },
      expiresInSeconds
    );
  }

  /**
   * Validate and decode an access token
   */
  validateAccessToken(token: string): ValidatedPrincipal {
    const payload = this.jwtService.verify(token);

    if (payload.type === 'user') {
      if (!payload.sessionId) {
        throw new Error('User token missing sessionId');
      }
      return {
        userId: payload.sub,
        orgId: payload.orgId,
        sessionId: payload.sessionId,
        type: 'user',
      };
    } else {
      return {
        serviceAccountId: payload.sub,
        orgId: payload.orgId,
        type: 'service',
      };
    }
  }
}
