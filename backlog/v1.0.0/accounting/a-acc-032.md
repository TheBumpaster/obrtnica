## A-ACC-032 — Prevent Postings in Closed Periods

> As the system, I must prevent postings in closed periods.

### Scope
Block all journal entry postings whose effective date falls into a closed period.

### Dependencies
- **Period definition/close**: `A-ACC-030`, `A-ACC-031`
- **Immutability/period control**: `A-ACC-R-001`
- **Audit**: `A-ACC-R-002`

### Implementation Outline (plan)
- At posting validation time, resolve the period for the entry date.
- Reject if period is closed.
- Provide path for adjustments: post into an open period with explicit reference (per `A-ACC-R-001`).

### Acceptance Criteria
- Posting is rejected when:
  - the target period is Closed
  - no applicable period exists for the date (policy must be decided and documented)
- Rejection is explicit and auditable.
- Applies to:
  - manual journal entries
  - system-generated entries (tax postings, deferred recognition, etc.)

### Definition of Done (DoD)
- Documented policy exists for “no period found for date” behavior.
- Tests (when implemented) cover:
  - open period success
  - closed period rejection
  - boundary dates (start/end inclusivity)
