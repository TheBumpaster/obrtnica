import type { AuditEvent, Logger, ValidatedPrincipal } from '@serp/core';
import { z } from 'zod';

import type { AuthenticatedPrincipal } from './middleware';

export const contextSchema = z.object({
  // Legacy support (to be phased out)
  userId: z.string().optional(),
  orgId: z.string().optional(),
  roles: z.array(z.string()).optional(),
  // New auth
  principal: z.custom<ValidatedPrincipal>().optional(),
  // Request tracking
  requestId: z.string(),
  correlationId: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});

export type Context = z.infer<typeof contextSchema> & {
  audit?: {
    log: (auditEvent: AuditEvent) => Promise<void>;
  };
  auth?: AuthenticatedPrincipal;
  logger?: Logger;
};
