import { authenticator } from 'otplib';

import { generateSecureToken, hashToken } from './crypto';

/**
 * Generate a new TOTP secret for MFA enrollment
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a QR code URI for TOTP apps (Google Authenticator, Authy, etc.)
 */
export function generateQrCodeUri(secret: string, email: string, issuer = 'Serp'): string {
  return authenticator.keyuri(email, issuer, secret);
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyTotp(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Generate recovery codes for MFA backup
 * Returns both plain codes (to show user once) and hashed codes (to store)
 */
export function generateRecoveryCodes(count = 10): { plain: string[]; hashed: string[] } {
  const plain: string[] = [];
  const hashed: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = generateSecureToken(8); // 8-char code
    plain.push(code);
    hashed.push(hashToken(code));
  }

  return { plain, hashed };
}

/**
 * Verify a recovery code against a hash
 */
export function verifyRecoveryCode(code: string, hash: string): boolean {
  return hashToken(code) === hash;
}
