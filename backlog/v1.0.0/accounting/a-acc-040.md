## A-ACC-040 — View the General Ledger

> As a user, I want to view the general ledger so that I can understand financial activity.

### Scope
Provide a read-only General Ledger view derived from journal entries.

### Dependencies
- **RBAC**: `A-ACC-R-003` (`accounting.ledger.view`)
- **Read-model strategy**: `A-ACC-R-004`
- **Immutability**: `A-ACC-R-001` (ledger is derived from immutable postings)

### Implementation Outline (plan)
- Define the GL view shape (date, entry reference, description, account, debit/credit, running balance optional).
- Support filters: date range, account, source module, source document id.
- Ensure pagination and stable ordering.

### Acceptance Criteria
- Users with `accounting.ledger.view` can access the general ledger view; others are denied.
- GL view is read-only and derived from journal entry lines.
- Filtering supports at minimum:
  - date range
  - account (single or multiple)
  - source module/document id (if present)
- Results are paginated with bounded defaults.
- Data returned is classified **CONFIDENTIAL + FINANCIAL**; logs do not include sensitive ledger contents.

### Definition of Done (DoD)
- Query/performance constraints from `A-ACC-R-004` are satisfied (no N+1, bounded payloads).
- If Mongo projections are introduced, Mongo-down behavior is defined and tested.
