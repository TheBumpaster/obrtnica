import type { AuditEvent } from '@serp/core';
import { z } from 'zod';

export const contextSchema = z.object({
  userId: z.string().optional(),
  orgId: z.string().optional(),
  roles: z.array(z.string()).optional(),
  requestId: z.string(),
  correlationId: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});

export type Context = z.infer<typeof contextSchema> & {
  audit?: {
    log: (auditEvent: AuditEvent) => Promise<void>;
  };
};
