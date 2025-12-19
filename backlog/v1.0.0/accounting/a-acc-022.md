## A-ACC-022 — Lock Journal Entries After Posting (Immutability)

> As the system, I must lock journal entries after posting so history cannot be altered.

### Scope
Once a journal entry is posted, it becomes immutable. Corrections happen via reversal/adjustment.

### Dependencies
- **Immutability**: `A-ACC-R-001`
- **Source traceability/audit**: `A-ACC-R-002`

### Implementation Outline (plan)
- Define explicit state transition: Draft/Created → Posted (immutable).
- Reject edit operations on posted entries; allow reversal workflow (separate action).

### Acceptance Criteria
- Posted entries cannot be edited or deleted.
- Any attempt to edit/delete a posted entry is rejected with an explicit reason.
- Corrections are represented by new entries (reversal/adjustment) referencing the original.
- Posting and rejected edits are auditable.

### Definition of Done (DoD)
- Immutability behavior applies consistently across API/UI and background jobs.
- Audit + source metadata requirements are satisfied (`A-ACC-R-002`).
