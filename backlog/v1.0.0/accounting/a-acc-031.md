## A-ACC-031 — Close an Accounting Period

> As an accountant, I want to close a period so that financials are finalized.

### Scope
Transition a period to **Closed** such that new postings into that period are prevented.

### Dependencies
- **RBAC**: `A-ACC-R-003` (`accounting.periods.manage`)
- **Audit**: `A-ACC-R-002` (closing emits audit event)
- **Immutability/period control**: `A-ACC-R-001`

### Implementation Outline (plan)
- Implement close action (with validation that period exists and belongs to org).
- Emit audit event on close.

### Acceptance Criteria
- Closing a period sets its status to Closed.
- Once closed, the system prevents new entries in that period (`A-ACC-032`).
- Close action emits an audit event including period id, actor, org, request/correlation id.
- Reopening behavior is restricted and audited (even if reopening is not a user story, the restriction must be explicit).

### Definition of Done (DoD)
- Failure modes are defined:
  - closing already-closed period
  - closing non-existent period
  - unauthorized close attempt
- All outcomes emit appropriate audit events (safe metadata).
