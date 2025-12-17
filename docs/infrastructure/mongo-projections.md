# MongoDB Projections

## Overview

MongoDB is used exclusively for **derived read models** (projections). It stores pre-aggregated data optimized for dashboard and analytics queries.

**Critical principle**: MongoDB data is **rebuildable** from Postgres + events. Losing MongoDB does not lose authoritative data.

## Current Projections

### `sample_projections`

Updated by: `sample.event.created`

**Schema**:
```javascript
{
  sampleId: string (unique index),
  data: string,
  tenantId: string (indexed),
  eventId: string,
  createdAt: Date (indexed descending),
  updatedAt: Date
}
```

**Indexes**:
- `{ sampleId: 1 }` - unique
- `{ tenantId: 1 }` - for tenant-scoped queries
- `{ createdAt: -1 }` - for time-sorted lists

**Query patterns**:
- List recent samples for a tenant
- Lookup sample by ID

## Rebuild Strategy

Projections can be rebuilt by replaying events from `outbox_events`:

1. Stop worker
2. Drop collection: `db.sample_projections.drop()`
3. Query `outbox_events` ordered by `occurred_at ASC`
4. For each event, re-execute projection update logic
5. Restart worker

Future automation: A "rebuild projections" script will be added to simplify this process.

## Adding New Projections

1. Define collection schema and indexes in `apps/worker/src/mongo/index.ts`
2. Create consumer in `apps/worker/src/consumers/` that listens to relevant events
3. Update projection document on event receipt
4. Ensure idempotency via `processed_events` table
5. Document schema, indexes, and query patterns here

## Performance Considerations

- MongoDB queries should be fast (<50ms p95) due to indexes
- Avoid runtime aggregations; pre-compute values when possible
- Monitor index usage with `db.collection.explain()`
- Add compound indexes for multi-field queries

## Failure Handling

If MongoDB is unavailable:
- Worker logs errors but does not crash
- Events remain in RabbitMQ and retry
- Once MongoDB is restored, events are processed

If a projection update fails:
- Message is retried per RabbitMQ policy
- After max retries, message moves to DLQ
- Manual inspection and replay may be required
