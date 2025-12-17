---
alwaysApply: true
---

This repository prioritizes predictable performance and scalability.
Cursor must follow these rules for any change that can affect performance.

---

## 1) Database Query Hygiene (Postgres / Drizzle)

- Never introduce N+1 queries:
  - Do not run DB queries inside loops over result sets.
  - Use joins, batched `IN (...)` queries, or dedicated repository methods.

- Always scope queries by tenant/org when applicable:
  - tenant/org filters must be applied early and consistently.

- Select only required columns:
  - avoid `select *` and returning large payloads by default.

- Pagination:
  - Prefer keyset pagination for large datasets.
  - Avoid offset pagination for tables expected to grow large.

- Index awareness:
  - If a new query introduces a new access pattern, add the necessary index (or document why it is not needed).
  - Index changes must be paired with migrations and brief rationale in summary.

---

## 2) API/tRPC Performance

- tRPC procedures must remain thin:
  - validate → auth/tenant scope → call service → return
  - heavy work must be delegated to the worker via RabbitMQ.

- Response size discipline:
  - return only data required by the UI.
  - avoid nested/denormalized payloads unless explicitly required.

- Avoid blocking on external services:
  - provider calls (Mailjet/Twilio/FCM/APNs) must not happen inline in request handlers.
  - enqueue jobs and return quickly.

---

## 3) Analytics / Reporting (Mongo Projections)

- Do not add runtime-heavy aggregation over large ranges inside API requests.
- Prefer precomputed Mongo projections (dashboard-ready documents).
- Any new report endpoint must:
  - describe its projection structure
  - document query patterns and expected indexes
  - degrade gracefully if Mongo is unavailable

Mongo is derived; app-critical workflows must not depend on it.

---

## 4) Worker Throughput & Safety

- Any new consumer must:
  - be idempotent
  - have bounded concurrency assumptions (do not process unbounded parallel work)
  - implement retries + DLQ behavior (do not infinite retry silently)

- Prefer minimal message payloads:
  - IDs over full objects, especially for CONFIDENTIAL/RESTRICTED data.

---

## 5) Performance Verification (Required)

For performance-sensitive changes, Cursor must include in the task/PR summary:
- which queries were added/changed
- whether new indexes were added
- whether work was offloaded to worker
- expected payload sizes (rough estimate is acceptable)
- failure modes (Mongo down / queue down)

If this summary is missing for a performance-sensitive change, the task is NOT DONE.
