# Domain Events

## Overview

Domain events represent significant business occurrences in the system. They are the source of truth for async workflows and derived projections.

## Event Structure

All events conform to this structure:

```typescript
{
  eventId: string;          // UUID, globally unique
  eventType: string;        // e.g., "sample.event.created"
  eventVersion: string;     // e.g., "1.0.0" (for schema evolution)
  tenantId: string;         // Org/tenant ID for multi-tenancy
  correlationId?: string;   // Request/trace ID for observability
  occurredAt: Date;         // When the event happened
  payload: Record<string, unknown>; // Event-specific data
}
```

## Event Flow

1. **Emit**: Domain logic creates event and writes to `outbox_events` table (transactionally with data change)
2. **Dispatch**: Outbox dispatcher polls table and publishes to RabbitMQ
3. **Consume**: Worker consumers receive event from queue
4. **Process**: Consumer updates projections, sends notifications, etc.
5. **Track**: Event ID recorded in `processed_events` for idempotency

## Current Event Types

### `sample.event.created` (v1.0.0)

Emitted when: A sample entity is created via API

**Payload**:
```typescript
{
  sampleId: string;
  data: string;
}
```

**Consumers**:
- `sample-event-consumer`: Updates `sample_projections` in MongoDB

### `notification.requested` (planned)

Emitted when: A notification should be sent to a user

**Payload**:
```typescript
{
  recipientId: string;
  channels: Array<'email' | 'sms' | 'push'>;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}
```

**Consumers**:
- `notification-consumer`: Delivers via appropriate channels

### `gdpr.export.requested` (v1)

Emitted when: A GDPR data export is requested via API

**Payload**:
```typescript
{
  requestId: string;
  targetUserId: string;
  requesterUserId: string;
  scopeOrgId?: string | null;
}
```

**Consumers**:
- `gdpr-export-consumer`: Builds export bundle, stores via StorageAdapter, updates request status, emits completion audit

**Notes**:
- If `scopeOrgId` is provided, export is org-scoped (admin-on-behalf)
- If `scopeOrgId` is null, export includes all user data across all orgs (self-service)
- Export expires after 30 days (`expires_at`)

### `gdpr.erase.requested` (v1)

Emitted when: A GDPR erasure (right to be forgotten) is requested via API

**Payload**:
```typescript
{
  requestId: string;
  targetUserId: string;
  requesterUserId: string;
  scopeOrgId?: string | null;
  mode: 'ANONYMIZE' | 'DELETE';
}
```

**Consumers**:
- `gdpr-erase-consumer`: Anonymizes/deletes user data in Postgres, cleans up MongoDB projections (best-effort), emits completion audit

**Notes**:
- Default mode is `ANONYMIZE` (preserves referential integrity)
- `DELETE` mode not implemented in v1.0.0
- If `scopeOrgId` is provided, erasure is org-scoped (admin-on-behalf)
- MongoDB cleanup is best-effort (non-fatal if Mongo is down)
- Audit events are never deleted (compliance requirement)

### `audit.event.created` (v1)

Emitted when: An audit event needs to be persisted to the audit_events table

**Payload**:
```typescript
{
  auditEvent: {
    id: string;
    occurredAt: string; // ISO 8601
    eventType: string; // e.g., 'security.permission.denied'
    eventVersion: number;
    severity: 'INFO' | 'WARN' | 'ERROR';
    tenantId?: string;
    actorType: 'USER' | 'SERVICE' | 'SYSTEM';
    actorId?: string;
    actorDisplay?: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
    correlationId?: string;
    resourceType?: string;
    resourceId?: string;
    action?: string;
    status: 'SUCCESS' | 'FAILURE';
    reason?: string;
    dataClassification: string;
    dataCategories: string[];
    metadata?: Record<string, unknown>;
  };
}
```

**Consumers**:
- `audit-event-consumer`: Writes audit event to `audit_events` table (append-only)

**Notes**:
- All audit metadata is sanitized before being placed in the event payload
- Forbidden keys (password, token, secret, etc.) are stripped recursively
- This event follows the transactional outbox pattern: emitted in the same DB transaction as the action being audited

## Adding New Events

1. Define event type constant in `packages/core/src/events/event-types.ts`
2. Create event factory function in `packages/core/src/events/`
3. Emit event in domain service via outbox write
4. Create consumer in `apps/worker/src/consumers/`
5. Document event schema and consumers here

## Idempotency

All consumers MUST check `processed_events` table before processing to ensure idempotency:

```typescript
const existing = await db
  .select()
  .from(processedEvents)
  .where(eq(processedEvents.eventId, event.eventId));

if (existing.length > 0) {
  console.log('Event already processed, skipping');
  channel.ack(msg);
  return;
}
```

## Versioning

Event schemas may evolve over time. Use `eventVersion` field to handle multiple versions:

```typescript
if (event.eventVersion === '1.0.0') {
  // Handle v1 schema
} else if (event.eventVersion === '2.0.0') {
  // Handle v2 schema
}
```

Maintain backward compatibility when possible; document breaking changes clearly.

## Observability

- `correlationId` links events to originating API request
- Log event ID and type on publish and consume
- Monitor queue depth and consumer lag in RabbitMQ UI
- Track DLQ for poison messages requiring manual intervention
