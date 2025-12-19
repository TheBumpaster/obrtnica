import { createSampleEvent, buildDomainWriteAuditEvent, buildUserActor } from '@serp/core';
import { requireUserAuth } from '@serp/trpc';
import { sampleCreateInputSchema, sampleCreateOutputSchema, sampleListOutputSchema } from '@serp/validations';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';

import { enqueueAuditEvent } from '../audit/audit.service';
import { db, outboxEvents, sampleEntities } from '../db';
import { protectedProcedure, router } from './base';

export const sampleRouter = router({
  create: protectedProcedure
    .input(sampleCreateInputSchema)
    .output(sampleCreateOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const auth = requireUserAuth(ctx);
      const id = ulid();
      
      // Transactional insert with outbox pattern
      await db.transaction(async (tx) => {
        // Insert sample entity
        await tx.insert(sampleEntities).values({
          id,
          orgId: auth.orgId,
          data: input.data,
          version: 0,
        });

        // Create and emit domain event
        const event = createSampleEvent(auth.orgId, { sampleId: id, data: input.data }, ctx.correlationId);

        // Write to outbox
        await tx.insert(outboxEvents).values({
          id: ulid(),
          eventId: event.eventId,
          eventType: event.eventType,
          eventVersion: event.eventVersion,
          tenantId: event.tenantId,
          correlationId: event.correlationId,
          payload: event.payload,
          occurredAt: event.occurredAt,
        });

        // Emit audit event for data write (Pilot #2)
        const auditEvent = buildDomainWriteAuditEvent({
          tenantId: auth.orgId,
          actor: buildUserActor(auth.userId),
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
          correlationId: ctx.correlationId,
          resourceType: 'SampleEntity',
          resourceId: id,
          action: 'CREATE',
          metadata: { dataLength: input.data.length },
        });

        await enqueueAuditEvent(tx, auditEvent);
      });

      return { id, data: input.data };
    }),

  list: protectedProcedure
    .output(sampleListOutputSchema)
    .query(async ({ ctx }) => {
      const auth = requireUserAuth(ctx);
      const results = await db
        .select({ id: sampleEntities.id, data: sampleEntities.data })
        .from(sampleEntities)
        .where(eq(sampleEntities.orgId, auth.orgId))
        .limit(100);
      
      return results;
    }),
});
