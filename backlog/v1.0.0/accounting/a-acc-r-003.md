## A-ACC-R-003 — Accounting Permissions & RBAC Enforcement

### Purpose
Define and enforce **who can do what** in Accounting using platform permissions (middleware-enforced), consistent with Settings and repo rules.

### Applies to
All Accounting API/UI surfaces and actions in stories `A-ACC-001`…`A-ACC-070`.

### Constraints (binding)
- Accounting permissions list in: `backlog/v1.0.0/accounting/requirement.md`
- Settings RBAC rules: `backlog/v1.0.0/settings/requirement.md`
- Middleware enforcement: `.cursor/rules/api-trpc/RULE.md`, `.cursor/rules/auth-multitenancy/RULE.md`

### Permission Map (from Accounting epic)
- Chart of Accounts:
  - `accounting.coa.manage`
  - `accounting.coa.view`
- Journal entry templates:
  - `accounting.journal_templates.manage`
- Journal entries:
  - `accounting.entries.create`
  - `accounting.entries.view`
- Accounting periods:
  - `accounting.periods.manage`
- Ledger views:
  - `accounting.ledger.view`
- Tax configuration:
  - `accounting.tax.manage`
- Deferred:
  - `accounting.deferred.manage`
- Immutable ledger/audit enforcement:
  - system-enforced (not user-controlled), but access to views still permission-gated

### Acceptance Criteria
- **Middleware-enforced authz**: Permission checks are enforced in API middleware (not in handler bodies, not in UI).
- **Tenant scope**: All reads/writes are scoped to the active organization context.
- **UI visibility**: UI hides actions the user cannot perform, but API remains the source of truth (UI hiding is not security).
- **Auditability**: Permission denials for sensitive accounting actions emit audit events per audit rules.

### Definition of Done (DoD)
- Each Accounting story plan explicitly lists the permission(s) needed (or “system-enforced” where applicable).
- Any new/changed permission behavior is covered by:
  - a permission-denied test (when implemented)
  - a tenant boundary test (when implemented)
- Repo DoD gates satisfied (`.cursor/rules/definition-of-done/RULE.md`).
