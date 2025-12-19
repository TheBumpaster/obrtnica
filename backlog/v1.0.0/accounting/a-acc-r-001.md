## A-ACC-R-001 — Immutability & Correction Strategy (Ledger / Journal / Period)

### Purpose
Enforce Accounting’s locked principles: **append-only**, **no silent history changes**, and **corrections via reversal/adjustment**, including **period control**.

### Applies to
- **Journal Entries** (`A-ACC-020`, `A-ACC-022`, `A-ACC-021`)
- **Accounting Periods** (`A-ACC-030`, `A-ACC-031`, `A-ACC-032`)
- **Deferred Revenue/Expense** (`A-ACC-060`, `A-ACC-061`)
- **Ledger Views** (`A-ACC-040`, `A-ACC-041`)
- **Immutable Ledger & Audit** (`A-ACC-070`)

### Constraints (binding)
- Accounting epic: `backlog/v1.0.0/accounting/requirement.md` (Immutability + Period Control + Double-entry)
- Audit: `docs/compliance/procedures/audit-logging.md` + `.cursor/rules/audit-logging/RULE.md`
- Data safety/consistency: `.cursor/rules/data-postgres-drizzle/RULE.md`, `.cursor/rules/quality-gates/RULE.md`

### Acceptance Criteria
- **Append-only**: Posted financial postings are never edited in-place; only new postings are added.
- **No hard deletes**: Accounting records are not hard-deleted (delete operations are either rejected or handled as soft-delete where permitted by domain).
- **Corrections**:
  - Corrections to posted entries are represented as **reversal entries** and/or **adjustment entries**.
  - Original entry remains queryable and linked to the correcting entry/entries.
- **Period control**:
  - Posting into a **closed** accounting period is rejected.
  - If a correction is required for a closed period, it is posted into an **open** period as an adjustment (with explicit reference to what is being corrected).
- **Traceability**: Any correction/reversal retains original references (source module/document/actor) per `A-ACC-R-002`.

### Definition of Done (DoD)
- A documented, testable policy exists for:
  - what constitutes “posted/immutable”
  - allowed correction mechanisms (reversal vs adjustment)
  - behavior in closed periods
- All relevant write operations emit audit events (success + failure paths) with safe metadata.
- Data classification is explicitly stated for stored records and audit events:
  - Accounting records: **CONFIDENTIAL + FINANCIAL**
  - Audit records: **RESTRICTED + AUDIT**
- Repo DoD gates are met for the implemented work (see `.cursor/rules/definition-of-done/RULE.md`).

### Notes
- This requirement is **non-negotiable** because Accounting’s “single immutable truth” is a core principle.
