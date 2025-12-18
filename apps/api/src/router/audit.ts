import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { auditEvents, db } from '../db';

import { protectedProcedure, router } from './index';

const listAuditEventsInput = z.object({
  limit: z.number().min(1).max(200).default(50),
  offset: z.number().min(0).default(0),
  actorId: z.string().optional(),
  eventType: z.string().optional(),
  status: z.enum(['SUCCESS', 'FAILURE']).optional(),
  resourceId: z.string().optional(),
  requestId: z.string().optional(),
  correlationId: z.string().optional(),
  q: z.string().max(200).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const auditRouter = router({
  listEvents: protectedProcedure.input(listAuditEventsInput).query(async ({ input, ctx }) => {
    const filters: SQL<unknown>[] = [eq(auditEvents.tenantId, ctx.auth.orgId)];

    if (input.actorId) filters.push(eq(auditEvents.actorId, input.actorId));
    if (input.eventType) filters.push(eq(auditEvents.eventType, input.eventType));
    if (input.status) filters.push(eq(auditEvents.status, input.status));
    if (input.resourceId) filters.push(eq(auditEvents.resourceId, input.resourceId));
    if (input.requestId) filters.push(eq(auditEvents.requestId, input.requestId));
    if (input.correlationId) filters.push(eq(auditEvents.correlationId, input.correlationId));
    if (input.from) filters.push(gte(auditEvents.occurredAt, new Date(input.from)));
    if (input.to) filters.push(lte(auditEvents.occurredAt, new Date(input.to)));

    if (input.q) {
      const term = `%${input.q}%`;
      filters.push(
        or(
          ilike(auditEvents.resourceId, term),
          ilike(auditEvents.requestId, term),
          ilike(auditEvents.correlationId, term),
          ilike(auditEvents.actorDisplay, term),
          ilike(auditEvents.action, term)
        ) as SQL<unknown>
      );
    }

    const whereClause = and(...filters);

    const items = await db
      .select()
      .from(auditEvents)
      .where(whereClause)
      .orderBy(desc(auditEvents.occurredAt))
      .limit(input.limit)
      .offset(input.offset);

    const countResult = await db
      .select({ total: sql<number>`count(*)` })
      .from(auditEvents)
      .where(whereClause);

    const total = Number(countResult[0]?.total || 0);
    const nextOffset = input.offset + items.length;

    return {
      total,
      nextOffset: nextOffset < total ? nextOffset : null,
      items: items.map((event) => ({
        id: event.id,
        occurredAt: event.occurredAt.toISOString(),
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        severity: event.severity,
        actorType: event.actorType,
        actorId: event.actorId || undefined,
        actorDisplay: event.actorDisplay || undefined,
        status: event.status,
        reason: event.reason || undefined,
        resourceType: event.resourceType || undefined,
        resourceId: event.resourceId || undefined,
        action: event.action || undefined,
        requestId: event.requestId || undefined,
        correlationId: event.correlationId || undefined,
        dataClassification: event.dataClassification,
        dataCategories: event.dataCategories,
        metadata: event.metadata || undefined,
      })),
    };
  }),
});
