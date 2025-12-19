## A-ACC-003 — Prevent Deletion of Accounts With Entries

> As the system, I must prevent deletion of accounts that have accounting entries.

### Scope
Guarantee CoA referential integrity: accounts referenced by any journal entry line remain preserved.

### Dependencies
- **RBAC**: `A-ACC-R-003` (`accounting.coa.manage`)
- **Immutability**: `A-ACC-R-001`

### Implementation Outline (plan)
- Enforce at domain level (and DB constraints if applicable) that deletion is rejected when an account is referenced.
- Provide allowed alternative: deactivate account.

### Acceptance Criteria
- Attempting to delete an account that has any linked journal entry lines is rejected.
- Rejection provides a clear reason (e.g., “Account used in postings; cannot delete. Deactivate instead.”).
- Accounts with no usage may be deletable only if domain allows; otherwise, deletion is globally disallowed and only deactivation is used (must be explicitly decided).
- Action is tenant-scoped and permission-gated.

### Definition of Done (DoD)
- Consistent behavior across import/admin UI/API (no bypass path).
- Failure-path audit event emitted for forbidden delete attempts when considered sensitive.
