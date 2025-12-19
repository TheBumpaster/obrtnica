## A-ACC-002 — Create & Manage Accounts (CoA)

> As an organization admin, I want to create and manage accounts so that my financial structure matches my business.

### Scope
Create/edit CoA accounts (metadata) while respecting constraints (e.g., cannot delete accounts used in entries).

### Dependencies
- **RBAC**: `A-ACC-R-003` (`accounting.coa.manage`, `accounting.coa.view`)
- **Immutability constraints**: `A-ACC-003` prevents deletion when used

### Implementation Outline (plan)
- CRUD for CoA accounts (create/update, activate/deactivate).
- Enforce hierarchy integrity and account type rules.
- Enforce “cannot delete if used” (delegated to `A-ACC-003`).

### Acceptance Criteria
- Admin can create new accounts with required fields (type, status; parent optional).
- Admin can update allowable fields (e.g., name/description/status/parent) without breaking hierarchy.
- Admin can deactivate accounts so they cannot be used in new postings (active accounts only for postings).
- Users without `accounting.coa.manage` cannot create/update; users with `accounting.coa.view` can view.

### Definition of Done (DoD)
- Story references and conforms to `A-ACC-003` deletion prevention.
- Authorization + tenancy + auditability requirements are respected (`A-ACC-R-002`, `A-ACC-R-003`).
