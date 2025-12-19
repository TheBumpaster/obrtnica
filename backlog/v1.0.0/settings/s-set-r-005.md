## S-SET-R-005 — Async Side Effects & Notifications Pipeline

### What this governs
Outbox/worker-driven delivery of invites and security/auth notifications; idempotency and safe retries.

### Depends / used by
Invites (`S-SET-010`–`011`), security settings (`S-SET-040`–`041`), possibly billing/plan change notifications (`S-SET-030`–`032`), integrations toggles (`S-SET-050`–`051`).

### Constraints (from rules/docs)
- `.cursor/rules/worker-event-driven/RULE.md`, `.cursor/rules/messaging-rabbitmq/RULE.md`
- `.cursor/rules/api-mvp-patterns/RULE.md` (API must not block on providers)
- `docs/infrastructure/runbook.md` (outbox, retries, DLQ)

### Acceptance Criteria
- Emails/notifications are queued via outbox → worker → provider; API does not block on provider delivery.
- Messages are versioned, tenant-scoped, include correlation/request ids when available, and are idempotent (safe to retry).
- Failures go through retry policy then DLQ with enough metadata for replay.

### Definition of Done (DoD)
- Dependent stories state whether they enqueue notifications and reference this requirement.
- Provider credentials are treated as RESTRICTED; no secrets in logs or audit metadata.
- Repo DoD gates apply.
