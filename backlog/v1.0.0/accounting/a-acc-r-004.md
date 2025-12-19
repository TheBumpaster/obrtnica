## A-ACC-R-004 — Ledger Views & Read-Model Strategy (Postgres vs Mongo)

### Purpose
Define how Accounting read models (General Ledger, account balances) are exposed as **read-only derived views** with scalable query patterns.

### Applies to
Primarily `A-ACC-040`, `A-ACC-041`, and any future reporting endpoints.

### Constraints (binding)
- Read-only derived views: `backlog/v1.0.0/accounting/requirement.md`
- Postgres is system of record: `.cursor/rules/data-postgres-drizzle/RULE.md`
- MongoDB is derived only + optional: `.cursor/rules/mongodb-derived-only/RULE.md`
- Performance/scalability: `.cursor/rules/performance-policy/RULE.md`, `.cursor/rules/scalability-design/RULE.md`

### Strategy (MVP)
- **Primary**: Ledger views computed from authoritative Postgres journal entry data (deterministic, consistent).
- **Optional acceleration**: Mongo projections may be introduced later for dashboard/report performance, but must remain:
  - derived
  - rebuildable from Postgres + events
  - non-blocking to core workflows if Mongo is down

### Acceptance Criteria
- **Read-only**: Ledger endpoints do not mutate accounting data.
- **Pagination & bounds**: Any list endpoint is paginated with bounded default + max limits.
- **Query hygiene**:
  - No N+1 query patterns.
  - Select only required fields.
  - Index-backed ordering for common filters (to be decided at implementation time).
- **Mongo-down behavior (if projections exist)**:
  - Ledger endpoints either fall back to Postgres or degrade gracefully with clear messaging; core accounting flows remain functional.

### Definition of Done (DoD)
- `A-ACC-040` and `A-ACC-041` plans explicitly state:
  - expected filters/pagination
  - ordering strategy (conceptually)
  - data classification for returned data (CONFIDENTIAL + FINANCIAL)
- If any events/projections are introduced later, they are documented in `docs/infrastructure/events.md` and follow idempotency rules.
