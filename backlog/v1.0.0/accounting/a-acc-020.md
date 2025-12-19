## A-ACC-020 — Create a Journal Entry

> As an accountant, I want to create a journal entry so that financial events are recorded.

### Scope
Create/record a journal entry with header + lines and validate against: open period, active accounts, balanced posting.

### Dependencies
- **RBAC**: `A-ACC-R-003` (`accounting.entries.create`, `accounting.entries.view`)
- **Immutability**: `A-ACC-R-001`
- **Source traceability/audit**: `A-ACC-R-002`
- **Periods**: `A-ACC-030` (definition) and `A-ACC-032` (enforcement)

### Implementation Outline (plan)
- Define entry header: date, reference, description.
- Define entry lines: account + debit/credit amount(s).
- Validate:
  - period open
  - accounts active
  - balanced totals (delegated to `A-ACC-021`)
- Posting step results in immutable record (delegated to `A-ACC-022`).

### Acceptance Criteria
- User can create an entry with:
  - Date, reference, description
  - ≥ 2 lines (at least one debit and one credit)
- System validates:
  - Period is open (reject if closed)
  - Accounts are active (reject if inactive)
  - Entry is balanced (see `A-ACC-021`)
- Entry stores source metadata (module/document/actor) per `A-ACC-R-002`.

### Definition of Done (DoD)
- Any create/post action is audited with safe metadata (success/failure) per audit rules.
- Data classification is documented as **CONFIDENTIAL + FINANCIAL**.
