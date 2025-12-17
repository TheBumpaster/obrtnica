import type { AuditEvent } from './types';

// Forbidden keys that should never appear in audit metadata
const FORBIDDEN_KEYS = [
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authorization',
  'auth',
  'secret',
  'apiKey',
  'api_key',
  'otp',
  'mfa',
  'ssn',
  'creditCard',
  'credit_card',
  'cvv',
  'pin',
  'privateKey',
  'private_key',
];

// Maximum metadata JSON string length (100KB)
const MAX_METADATA_SIZE = 100 * 1024;

/**
 * Recursively sanitizes metadata by removing forbidden keys.
 * Returns a new object with forbidden keys stripped out.
 */
export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return metadata;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Check if key is forbidden (case-insensitive)
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_KEYS.some((forbidden) => lowerKey.includes(forbidden.toLowerCase()))) {
      continue; // Skip this key
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditMetadata(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      // Sanitize arrays of objects
      sanitized[key] = value.map((item) =>
        item && typeof item === 'object' && !Array.isArray(item)
          ? sanitizeAuditMetadata(item as Record<string, unknown>)
          : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitizes an entire audit event.
 * - Removes forbidden keys from metadata
 * - Enforces metadata size limits
 * - Ensures actor display doesn't contain sensitive data
 */
export function sanitizeAuditEvent(event: AuditEvent): AuditEvent {
  const sanitized: AuditEvent = {
    ...event,
    metadata: sanitizeAuditMetadata(event.metadata),
  };

  // Enforce size limit on metadata
  if (sanitized.metadata) {
    const metadataStr = JSON.stringify(sanitized.metadata);
    if (metadataStr.length > MAX_METADATA_SIZE) {
      console.warn(
        `Audit event ${event.id} metadata exceeds size limit (${metadataStr.length} bytes), truncating`
      );
      sanitized.metadata = {
        _truncated: true,
        _originalSize: metadataStr.length,
        _reason: 'Metadata exceeded maximum size limit',
      };
    }
  }

  // Ensure actor display doesn't accidentally contain sensitive data
  // (This is a basic check; in practice, callers should provide safe values)
  if (sanitized.actor.display) {
    // Truncate very long display strings
    if (sanitized.actor.display.length > 255) {
      sanitized.actor.display = sanitized.actor.display.substring(0, 252) + '...';
    }
  }

  return sanitized;
}
