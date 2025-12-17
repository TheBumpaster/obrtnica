---
alwaysApply: true
---

This repository must remain scalable by default. Cursor must follow these guardrails for any change that impacts data access, APIs, workers, or reporting.

---

## 1) Multi-Tenancy Scalability (Non-Negotiable)

- All data access must be tenant/org scoped when applicable.
- No cross-tenant queries are allowed in request paths unless explicitly required and documented.
- Any “admin/global” query must:
  - be explicitly authorized
  - be audited
  - be paginated
  - be rate-limited if it can be abused

---

## 2) Pagination Defaults (Every List Endpoint)

- Any endpoint that can return multiple rows must support pagination.
- Default behavior must be bounded:
  - a default limit must exist
  - a max limit must be enforced
- Prefer keyset pagination for large tables.
- Do not return unbounded arrays by default.

---

## 3) Payload Discipline

- Return only the fields needed by the UI.
- Avoid nested/denormalized payloads unless explicitly required.
- Do not embed large blobs or large JSON objects in normal list endpoints.
- For exports, use async jobs and external storage adapters (never inline huge payloads).

---

## 4) Query Performance Guardrails (Postgres)

- Avoid N+1 queries (no DB calls inside loops).
- If a new query pattern is introduced:
  - ensure indexes exist, or
  - document why the index is unnecessary.
- Any new “order by” used at scale must be index-backed or justified.

---

## 5) Reporting & Analytics Guardrails (Mongo)

- Reporting must use derived projections (Mongo) for fast reads.
- Do not add heavy runtime aggregations over large time ranges in API request paths.
- Mongo outages must not break core workflows.
- Projections must be rebuildable by worker jobs and/or replay.

---

## 6) Asynchronous Workloads (Queues)

- Any heavy task must be moved to RabbitMQ + worker:
  - notifications delivery
  - analytics projection updates
  - GDPR export/erase jobs
  - indexing and rebuild tasks
- Queue consumers must have bounded concurrency assumptions and be idempotent.
- Message payloads must be minimal; prefer IDs over embedded objects.

---

## 7) Limits and Protection Against Abuse

For endpoints and background jobs that can be abused:
- enforce rate limits (where applicable)
- enforce size limits (payload sizes, file sizes, export ranges)
- enforce time-range limits for reporting queries (or require pagination/chunking)

If limits are needed but not yet implemented, Cursor must document them in `docs/decisions/`
and add a backlog item to implement them.

---

## 8) Verification Requirement

For changes likely to impact scalability, Cursor must include in the summary:
- pagination behavior and limits
- query patterns and indexes
- payload size expectations
- worker/queue offloading decisions
- failure modes (Mongo down / queue down)

If this summary is missing, the task is NOT DONE.
