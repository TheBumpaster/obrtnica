---
alwaysApply: true
---

The worker must follow an event-driven architecture (EDA) design.

Applies to:
- apps/worker

---

## 1) Worker Structure (Required)

Workers must be organized into:
- `consumers/` (queue consumers, one file per message type)
- `handlers/` (pure handling logic called by consumers; orchestrates domain services)
- `events/` (event definitions, versioning, routing keys)
- `infra/` (RabbitMQ connection, retry/DLQ wiring, message envelope parsing)
- `schedulers/` (cron-like jobs, projection rebuilds, retention cleanup)
- `utils/` (logging, correlation, idempotency helpers)

Rules:
- Consumers should be thin: parse → validate → call handler.
- Handlers should call `packages/core` domain services.
- No business logic in consumers.

---

## 2) Message Contract Requirements

Every message must:
- be versioned: `event_type` + `event_version`
- include `event_id`, `occurred_at`
- include `tenant_id` where applicable
- include `correlation_id` / `request_id` when available
- carry minimal payloads (IDs over objects, especially for CONFIDENTIAL/RESTRICTED data)

---

## 3) Idempotency, Retries, DLQ

- Every consumer must be idempotent.
- Retries must be bounded with exponential backoff where possible.
- Poison messages go to DLQ with enough metadata to replay safely.
- Provide replay tooling where required (documented commands).

---

## 4) Derived Systems Behavior

Worker responsibilities include:
- Mongo projections (derived, rebuildable)
- Notifications delivery (push/email/sms)
- GDPR export/erase jobs
- Audit events for background actions

If Mongo or providers are down:
- worker must fail safely
- retries/DLQ must capture the failure
- core app must remain functional

---

## 5) Observability

- All consumers must produce structured logs with:
  - event_id
  - event_type
  - tenant_id
  - correlation_id
  - status (success/failure)
- Failures must be explicit and actionable (no silent catch).
