## A-ACC-001 — Import Chart of Accounts (CoA)

> As an organization admin, I want to import a chart of accounts so that I can start accounting quickly.

### Scope
Import a CoA into an organization using a default template and/or imported structure.

### Dependencies
- **RBAC**: `A-ACC-R-003` (`accounting.coa.manage`)
- **Tenancy**: org-scoped operations (see `.cursor/rules/auth-multitenancy/RULE.md`)
- **Data classification**: CoA is **INTERNAL** (per accounting epic table); avoid leaking to logs.

### Implementation Outline (plan)
- Define supported import format(s) (CSV/JSON) and validation rules (required fields, hierarchy integrity).
- Implement import as an idempotent operation (safe re-run) or explicitly document duplicate handling.
- Ensure imported accounts are created in correct hierarchy with types and active/inactive status.

### Acceptance Criteria
- Import creates accounts with:
  - **Type** (Asset/Liability/Equity/Revenue/Expense)
  - optional **Parent** (hierarchy)
  - **Status** (active/inactive)
- System provides a default CoA template option.
- Validation rejects invalid imports (unknown types, broken parent references, duplicate codes if codes must be unique).
- Only users with `accounting.coa.manage` can import; others are denied and audited when applicable.

### Definition of Done (DoD)
- Import workflow is documented (format + examples) in the plan’s eventual implementation notes.
- Audit expectations for create/import are satisfied (see `A-ACC-R-002`).
- Implementation (later) meets repo DoD gates (`.cursor/rules/definition-of-done/RULE.md`).
