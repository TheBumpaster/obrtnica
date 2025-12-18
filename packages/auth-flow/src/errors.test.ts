import { TRPCClientError } from '@trpc/client';
import { describe, expect, it } from 'vitest';

import { isUnauthorizedError, mapTrpcErrorToAuthError } from './errors';

function makeTrpcError(message: string, code?: string) {
  const err = new TRPCClientError(message, { meta: undefined } as any);
  (err as any).data = code ? { code } : undefined;
  return err;
}

describe('mapTrpcErrorToAuthError', () => {
  it('maps invalid credentials', () => {
    const err = makeTrpcError('Invalid credentials');
    const mapped = mapTrpcErrorToAuthError(err);
    expect(mapped.code).toBe('invalid_credentials');
    expect(mapped.message).toContain('Invalid email or password');
  });

  it('maps rate limited', () => {
    const err = makeTrpcError('too many', 'TOO_MANY_REQUESTS');
    const mapped = mapTrpcErrorToAuthError(err);
    expect(mapped.code).toBe('rate_limited');
  });

  it('falls back to unknown', () => {
    const mapped = mapTrpcErrorToAuthError(new Error('oops'));
    expect(mapped.code).toBe('unknown');
  });
});

describe('isUnauthorizedError', () => {
  it('detects TRPC UNAUTHORIZED code', () => {
    const err = makeTrpcError('auth required', 'UNAUTHORIZED');
    expect(isUnauthorizedError(err)).toBe(true);
  });

  it('detects unauthorized message', () => {
    const err = makeTrpcError('Unauthorized access');
    expect(isUnauthorizedError(err)).toBe(true);
  });

  it('ignores non-TRPC errors', () => {
    expect(isUnauthorizedError(new Error('Unauthorized'))).toBe(false);
  });
});
