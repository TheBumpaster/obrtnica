import type { inferFlattenedErrors } from 'zod';
import { TRPCClientError } from '@trpc/client';

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'invalid_code'
  | 'expired_token'
  | 'already_verified'
  | 'rate_limited'
  | 'not_found'
  | 'unauthorized'
  | 'mfa_required'
  | 'unknown';

export type AuthError = {
  code: AuthErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
  retryAfterSeconds?: number;
};

function extractFieldErrors(zodError: inferFlattenedErrors<any> | undefined) {
  if (!zodError?.fieldErrors) return undefined;
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(zodError.fieldErrors)) {
    if (messages && messages.length > 0) {
      result[field] = messages[0] as string;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function mapTrpcErrorToAuthError(err: unknown): AuthError {
  const fallback: AuthError = {
    code: 'unknown',
    message: 'Something went wrong. Please try again.',
  };

  if (!(err instanceof TRPCClientError)) {
    return fallback;
  }

  const trpcCode = (err.data as any)?.code;
  const message = err.message || fallback.message;
  const lowerMessage = message.toLowerCase();
  const fieldErrors = extractFieldErrors((err.data as any)?.zodError);
  const retryAfterSeconds = (err.data as any)?.retryAfterSeconds;

  // Heuristic mapping
  if (lowerMessage.includes('mfa') && lowerMessage.includes('required')) {
    return { code: 'mfa_required', message, fieldErrors, retryAfterSeconds };
  }

  if (lowerMessage.includes('invalid credentials')) {
    return { code: 'invalid_credentials', message: 'Invalid email or password.', fieldErrors, retryAfterSeconds };
  }

  if (lowerMessage.includes('invalid code') || lowerMessage.includes('expired code')) {
    return { code: 'invalid_code', message: 'Invalid or expired code.', fieldErrors, retryAfterSeconds };
  }

  if (lowerMessage.includes('expired token')) {
    return { code: 'expired_token', message: 'This link or token has expired.', fieldErrors, retryAfterSeconds };
  }

  if (lowerMessage.includes('already verified')) {
    return { code: 'already_verified', message, fieldErrors, retryAfterSeconds };
  }

  if (trpcCode === 'NOT_FOUND') {
    return { code: 'not_found', message, fieldErrors, retryAfterSeconds };
  }

  if (trpcCode === 'TOO_MANY_REQUESTS') {
    return {
      code: 'rate_limited',
      message: 'Too many attempts. Please try again shortly.',
      fieldErrors,
      retryAfterSeconds,
    };
  }

  if (trpcCode === 'UNAUTHORIZED') {
    return { code: 'unauthorized', message, fieldErrors, retryAfterSeconds };
  }

  if (trpcCode === 'BAD_REQUEST' && lowerMessage.includes('invalid or expired')) {
    return { code: 'invalid_code', message, fieldErrors, retryAfterSeconds };
  }

  return { ...fallback, fieldErrors, retryAfterSeconds };
}
