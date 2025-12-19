## A-ACC-021 — Reject Unbalanced Journal Entries

> As the system, I must reject unbalanced journal entries.

### Scope
Enforce double-entry accounting: **total debits == total credits** or reject.

### Dependencies
- **Double-entry**: locked principle in `backlog/v1.0.0/accounting/requirement.md`
- **Audit**: `A-ACC-R-002`

### Implementation Outline (plan)
- Compute totals across entry lines (with exact rounding rules defined for money/decimals).
- Reject if not balanced; do not partially save posted state.

### Acceptance Criteria
- Entry is rejected if:
  - total debits ≠ total credits
  - there are no debit lines or no credit lines
- Validation runs before posting/locking.
- Rejection includes a clear message and does not create a “posted” entry.
- Rejection emits a failure audit event when applicable (safe metadata only).

### Definition of Done (DoD)
- Rules are consistently applied for manual entries and system-generated entries.
- Test cases (when implemented) cover:
  - balanced success
  - unbalanced failure
  - rounding edge case policy (documented)
