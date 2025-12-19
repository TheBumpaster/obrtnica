## A-ACC-R-002 — Source Traceability & Audit Contract (Accounting Postings)

### Purpose
Ensure every accounting record is **explainable**: who/what caused it, from which module/document, and that all critical actions are **audited**.

### Applies to
- All postings and locking behavior: `A-ACC-020`–`A-ACC-022`, `A-ACC-031`–`A-ACC-032`, `A-ACC-061`, `A-ACC-070`, and any module-generated entries (Selling/Buying/Stock/Assets/Projects).

### Constraints (binding)
- Accounting: `backlog/v1.0.0/accounting/requirement.md` (Source-driven entries section)
- Event envelope: `docs/infrastructure/events.md`
- Audit logging: `docs/compliance/procedures/audit-logging.md` + `.cursor/rules/audit-logging/RULE.md`
- Data classification: `docs/data-classification.md` + `.cursor/rules/data-classification/RULE.md`
- Tenancy: `.cursor/rules/auth-multitenancy/RULE.md`

### Acceptance Criteria
- **Source metadata on entries**:
  - Every journal entry stores:
    - source module (e.g., Selling/Buying/Stock/Assets/Projects/Manual)
    - source document ID (or explicit “manual” reference)
    - actor (USER/SERVICE/SYSTEM) + actor id/display where applicable
    - correlation/request identifiers where available
- **Audit events for critical actions**:
  - Posting a journal entry emits an audit event (success/failure).
  - Rejecting an invalid entry (e.g., unbalanced, closed period) emits an audit event (failure) with safe metadata.
  - Closing/reopening a period emits an audit event (success/failure).
  - Background-generated postings (e.g., deferred recognition) emit audit events with actorType = SERVICE/SYSTEM.
- **Audit log safety**:
  - Audit metadata contains identifiers and summary fields only (no secrets, no full payloads).
  - Audit events are append-only and correlated (requestId/correlationId).
- **Tenant-aware**:
  - Source metadata and audit events are tenant/org scoped when applicable.

### Definition of Done (DoD)
- A minimal, consistent “source reference” shape is defined and reused (documented in this file and referenced by dependent stories).
- Audit events added/updated (if any) are documented in `docs/infrastructure/events.md` and follow event structure requirements.
- Tests (when implemented) include:
  - success-path audit emission
  - failure-path audit emission
  - tenant boundary / permission test
- Repo DoD gates satisfied (`.cursor/rules/definition-of-done/RULE.md`).
