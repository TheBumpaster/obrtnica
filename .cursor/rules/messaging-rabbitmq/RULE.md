---
alwaysApply: true
---

- RabbitMQ is used for async jobs/events; API requests must not block on external delivery.
- All consumers must be idempotent (safe to process the same message multiple times).
- Define retry policy and use DLQ for poison messages; never infinite-retry silently.
- Messages/events must include:
  - event_id (unique)
  - event_type
  - event_version
  - occurred_at
  - tenant_id/org_id (when applicable)
  - correlation_id / request_id when available
- Log success/failure with correlation IDs for traceability.
