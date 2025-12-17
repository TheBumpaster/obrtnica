import crypto from 'crypto';

export interface AccessTokenPayload {
  sub: string; // userId or serviceAccountId
  type: 'user' | 'service';
  orgId: string;
  sessionId?: string; // Only for user tokens
  iat: number;
  exp: number;
}

/**
 * Simple JWT implementation without external dependencies
 * Uses HS256 (HMAC-SHA256)
 */
export class JwtService {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * Sign a JWT access token
   */
  sign(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>, expiresInSeconds: number): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: AccessTokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify and decode a JWT access token
   */
  verify(token: string): AccessTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`);

    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as AccessTokenPayload;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token expired');
    }

    return payload;
  }

  private createSignature(data: string): string {
    return crypto.createHmac('sha256', this.secret).update(data).digest('base64url');
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str).toString('base64url');
  }

  private base64UrlDecode(str: string): string {
    return Buffer.from(str, 'base64url').toString('utf8');
  }
}
