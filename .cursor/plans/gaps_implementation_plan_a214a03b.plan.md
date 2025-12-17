---
name: Gaps Implementation Plan
overview: "Implement all identified gaps from project review: optimistic concurrency, DLQ/retry configuration, scheduled jobs, notification enhancements, and observability (structured logging, metrics, tracing)."
todos: []
---

# Implementation Plan: Project Review Gaps

This plan addresses all gaps identified in the project review report, organized by priority and dependency.

## 1. Optimistic Concurrency (Version Fields)

**Goal**: Add `version` field to mutation-critical tables for optimistic concurrency control.

**Tables to update** (based on concurrent update risk):

- `orgs` - Organization updates
- `org_roles` - Role modifications
- `workspaces` - Workspace updates
- `api_tokens` - Token updates (lastUsedAt, revocation)

**Implementation**:

- Add `version: integer('version').default(0).notNull()` to schemas in `packages/db/src/schema/`
- Generate migration: `apps/api/drizzle/0004_add_version_fields.sql`
- Update domain services to:
  - Increment version on updates
  - Check version in WHERE clause: `WHERE id = ? AND version = ?`
  - Throw concurrency error if version mismatch
- Update repositories in `apps/api/src/repositories/` to handle version checks

**Files to modify**:

- `packages/db/src/schema/tenant/orgs.ts`
- `packages/db/src/schema/rbac/org-roles.ts`
- `packages/db/src/schema/workspaces/workspaces.ts`
- `packages/db/src/schema/auth/api-tokens.ts`
- Domain services in `packages/core/src/services/`
- Repositories in `apps/api/src/repositories/`

---

## 2. RabbitMQ DLQ & Retry Policy Configuration

**Goal**: Make DLQ and retry policy explicit, configurable, and documented.

**Current state**: DLQ is configured but uses hardcoded TTL (60s). Retry policy not documented.

**Implementation**:

- Create retry policy configuration in `apps/worker/src/config.ts`:
  ```typescript
  RETRY_MAX_ATTEMPTS: number (default: 3)
  RETRY_INITIAL_DELAY_MS: number (default: 1000)
  RETRY_BACKOFF_MULTIPLIER: number (default: 2)
  DLQ_TTL_MS: number (default: 60000)
  ```

- Update `apps/worker/src/queue/setup.ts`:
  - Use config values instead of hardcoded TTL
  - Add retry count tracking in queue arguments
  - Document retry policy in comments
- Create retry helper in `apps/worker/src/queue/retry.ts`:
  - Exponential backoff calculation
  - Retry count tracking
  - DLQ routing after max attempts
- Update consumers to use retry helper
- Document in `docs/infrastructure/runbook.md`

**Files to modify**:

- `apps/worker/src/config.ts`
- `apps/worker/src/queue/setup.ts`
- `apps/worker/src/queue/retry.ts` (new)
- `docs/infrastructure/runbook.md`

---

## 3. Scheduled Jobs Infrastructure

**Goal**: Implement cron-like scheduled jobs for recurring tasks (cleanup, reports, reindexing).

**Implementation**:

- Install `node-cron` package
- Create scheduler service in `apps/worker/src/schedulers/scheduler.ts`:
  - Initialize cron jobs on worker startup
  - Support graceful shutdown
  - Log job execution
- Create job definitions in `apps/worker/src/schedulers/jobs/`:
  - `cleanup-expired-tokens.ts` - Remove expired API tokens (daily)
  - `cleanup-old-audit-events.ts` - Archive old audit events per retention policy (weekly)
  - `cleanup-expired-exports.ts` - Delete expired GDPR export files (daily)
  - `rebuild-projections.ts` - Rebuild MongoDB projections (optional, on-demand)
- Register jobs in `apps/worker/src/index.ts`
- Document in `docs/infrastructure/runbook.md`

**Files to create**:

- `apps/worker/src/schedulers/scheduler.ts`
- `apps/worker/src/schedulers/jobs/cleanup-expired-tokens.ts`
- `apps/worker/src/schedulers/jobs/cleanup-old-audit-events.ts`
- `apps/worker/src/schedulers/jobs/cleanup-expired-exports.ts`
- `apps/worker/src/schedulers/jobs/rebuild-projections.ts`

**Files to modify**:

- `apps/worker/src/index.ts`
- `apps/worker/package.json` (add node-cron)
- `docs/infrastructure/runbook.md`

---

## 4. Notification System Enhancements

### 4.1 Delivery Status Metadata

**Goal**: Add `delivery_status_metadata` field to in-app notifications schema.

**Implementation**:

- Update `packages/db/src/schema/notifications/in-app-notifications.ts`:
  - Add `deliveryStatusMetadata: jsonb('delivery_status_metadata').$type<DeliveryStatusMetadata>()`
- Define type in schema:
  ```typescript
  type DeliveryStatusMetadata = {
    email?: { sentAt: Date; providerId?: string; bounced?: boolean };
    sms?: { sentAt: Date; providerId?: string; failed?: boolean };
    push?: { sentAt: Date; delivered?: boolean; failed?: boolean };
  }
  ```

- Generate migration: `apps/api/drizzle/0005_add_delivery_status_metadata.sql`
- Update notification service to populate metadata

**Files to modify**:

- `packages/db/src/schema/notifications/in-app-notifications.ts`
- `apps/worker/src/services/notification-service.ts`

### 4.2 Notification Consumer

**Goal**: Implement RabbitMQ consumer for notification delivery.

**Implementation**:

- Create event type in `packages/core/src/events/event-types.ts`: `NOTIFICATION_REQUESTED`
- Create event factory in `packages/core/src/events/notification-requested.ts`
- Create consumer in `apps/worker/src/consumers/notification-consumer.ts`:
  - Consume `notification.requested` events
  - Check user preferences
  - Call `NotificationService` for each channel
  - Update in-app notification with delivery status
  - Handle failures gracefully
- Add queue in `apps/worker/src/queue/setup.ts`: `NOTIFICATIONS` + `NOTIFICATIONS_DLQ`
- Register consumer in `apps/worker/src/index.ts`

**Files to create**:

- `packages/core/src/events/notification-requested.ts`
- `apps/worker/src/consumers/notification-consumer.ts`

**Files to modify**:

- `packages/core/src/events/event-types.ts`
- `apps/worker/src/queue/setup.ts`
- `apps/worker/src/index.ts`

### 4.3 Mailjet Template Management

**Goal**: Add template management for Mailjet emails.

**Implementation**:

- Update `apps/worker/src/adapters/mailjet.ts`:
  - Add `sendTemplatedEmail()` method
  - Support template ID + variables
  - Fallback to plain text if template missing
- Create template registry in `apps/worker/src/adapters/mailjet-templates.ts`:
  - Map notification types to template IDs
  - Define template variable schemas
- Update `NotificationService` to use templates for known types

**Files to modify**:

- `apps/worker/src/adapters/mailjet.ts`
- `apps/worker/src/services/notification-service.ts`

**Files to create**:

- `apps/worker/src/adapters/mailjet-templates.ts`

### 4.4 Bounce/Complaint Webhook Handlers

**Goal**: Handle Mailjet bounce/complaint webhooks.

**Implementation**:

- Create webhook endpoint in `apps/api/src/router/notifications.ts`:
  - `notifications.mailjetWebhook` - POST endpoint
  - Validate webhook signature (if Mailjet provides)
  - Parse bounce/complaint events
  - Update notification delivery status
  - Mark email as invalid if hard bounce
- Create webhook handler in `apps/api/src/services/mailjet-webhook-handler.ts`
- Document webhook URL configuration

**Files to create**:

- `apps/api/src/router/notifications.ts`
- `apps/api/src/services/mailjet-webhook-handler.ts`

**Files to modify**:

- `apps/api/src/router/index.ts` (register router)

### 4.5 Phone Verification Flows

**Goal**: Implement phone verification for SMS notifications.

**Implementation**:

- Add schema in `packages/db/src/schema/notifications/phone-verification-tokens.ts`:
  - Similar to email verification tokens
  - Fields: `id`, `userId`, `phoneNumber`, `code`, `expiresAt`, `verifiedAt`
- Create endpoints in `apps/api/src/router/auth.ts`:
  - `auth.requestPhoneVerification` - Send SMS with code
  - `auth.verifyPhone` - Verify code
- Create domain service method in `packages/core/src/services/auth/auth-domain.ts`
- Emit events for SMS delivery
- Update user schema to include `phone_verified_at`

**Files to create**:

- `packages/db/src/schema/notifications/phone-verification-tokens.ts`

**Files to modify**:

- `packages/db/src/schema/auth/users.ts`
- `apps/api/src/router/auth.ts`
- `packages/core/src/services/auth/auth-domain.ts`

---

## 5. Observability

### 5.1 Structured JSON Logging (Pino)

**Goal**: Replace console.log with structured JSON logging using Pino.

**Implementation**:

- Install `pino` and `pino-pretty` (dev)
- Create logger factory in `packages/core/src/logger.ts`:
  - Initialize Pino with config
  - Support log levels from env
  - Pretty print in development
  - JSON in production
- Create context logger in `packages/trpc/src/context.ts`:
  - Attach correlation ID, request ID, user ID to logger
- Replace `console.log/error` in:
  - `apps/api/src/**/*.ts`
  - `apps/worker/src/**/*.ts`
- Update config files to include `LOG_LEVEL` env var

**Files to create**:

- `packages/core/src/logger.ts`

**Files to modify**:

- `packages/core/package.json` (add pino)
- `apps/api/package.json` (add pino)
- `apps/worker/package.json` (add pino)
- `packages/trpc/src/context.ts`
- All files using `console.log` (many)

### 5.2 Custom Metrics Service

**Goal**: Implement simple metrics collection (counters, gauges, histograms).

**Implementation**:

- Create metrics service in `packages/core/src/metrics/metrics.ts`:
  - Counter: `incrementCounter(name, labels)`
  - Gauge: `setGauge(name, value, labels)`
  - Histogram: `recordHistogram(name, value, labels)`
  - In-memory storage (simple Map-based)
- Create metrics endpoint in `apps/api/src/router/metrics.ts`:
  - `metrics.getMetrics` - Return current metrics (Prometheus-compatible format)
  - Optional: `/metrics` HTTP endpoint for scraping
- Instrument key operations:
  - API: request count, latency, error rate
  - Worker: queue depth, consumer lag, job success/failure
  - Auth: login attempts, MFA enrollments
  - Notifications: delivery success/failure by channel
- Update middleware to record metrics

**Files to create**:

- `packages/core/src/metrics/metrics.ts`
- `apps/api/src/router/metrics.ts`

**Files to modify**:

- `packages/trpc/src/middleware.ts` (add metrics)
- `apps/worker/src/consumers/*.ts` (add metrics)
- `apps/api/src/router/index.ts` (register metrics router)

### 5.3 Tracing (Optional/OpenTelemetry-Friendly)

**Goal**: Add OpenTelemetry-friendly tracing infrastructure (optional, can be deferred).

**Implementation** (if proceeding):

- Install `@opentelemetry/api`, `@opentelemetry/sdk-node`
- Create tracing service in `packages/core/src/tracing/tracing.ts`:
  - Initialize OpenTelemetry
  - Create spans for operations
  - Propagate trace context
- Instrument:
  - tRPC procedures (auto-span)
  - Worker consumers (span per event)
  - External calls (HTTP, DB queries)
- Export traces (console in dev, OTLP in prod)

**Files to create**:

- `packages/core/src/tracing/tracing.ts`

**Files to modify**:

- `packages/trpc/src/middleware.ts`
- `apps/worker/src/index.ts`

**Note**: This can be deferred if not immediately needed.

---

## Implementation Order

1. **Phase 1: Infrastructure** (Foundation)

   - Structured logging (5.1)
   - DLQ/Retry configuration (2)
   - Scheduled jobs (3)

2. **Phase 2: Data & Notifications** (Core features)

   - Optimistic concurrency (1)
   - Notification enhancements (4.1, 4.2, 4.3)

3. **Phase 3: Advanced Features** (Enhancements)

   - Webhook handlers (4.4)
   - Phone verification (4.5)
   - Metrics (5.2)
   - Tracing (5.3) - optional

---

## Testing Requirements

- Unit tests for:
  - Version field increment logic
  - Retry policy calculations
  - Scheduled job execution
  - Metrics collection
- Integration tests for:
  - Notification consumer end-to-end
  - Webhook handlers
  - Phone verification flow
- Manual testing:
  - DLQ behavior under failure
  - Scheduled job execution
  - Metrics endpoint

---

## Documentation Updates

- `docs/infrastructure/runbook.md` - Add sections for:
  - Retry policy configuration
  - Scheduled jobs
  - Metrics endpoint
  - Webhook configuration
- `docs/infrastructure/events.md` - Add `notification.requested` event
- `docs/compliance/procedures/audit-logging.md` - Note metrics for audit events