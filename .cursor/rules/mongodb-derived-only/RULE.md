---
alwaysApply: true
---

MongoDB is an optional, derived read-model store.

## 1) Allowed usage
- MongoDB may only store derived/projection documents for dashboards and reporting.
- MongoDB must not be used as a system of record.

## 2) Prohibited usage
- Core application workflows must not require MongoDB availability.
- No authentication, authorization, tenant membership, or billing-critical data in MongoDB.
- Avoid storing personal identifiers; prefer IDs.

## 3) Rebuildability
- Any Mongo collection must be rebuildable from Postgres + events.
- Each projection must define:
  - schema (zod recommended)
  - required indexes
  - rebuild strategy (range/cursor)

## 4) Failure behavior
- If MongoDB is down, dashboard/report endpoints must degrade gracefully.
- Workers must retry/DLQ projection updates; core flows must continue.

## 5) Documentation
- New projections must be documented in `docs/analytics.md` (or relevant doc):
  - collection name
  - purpose
  - document shape
  - indexes
  - rebuild steps
