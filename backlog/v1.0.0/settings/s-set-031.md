## S-SET-031 — Change Subscription Plan

> As an organization admin, I want to change my subscription plan so that it matches my needs.

### Scope
Upgrade/downgrade plan; triggers billing change; must be auditable.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.billing.manage`)
- Audit: `s-set-r-003` (billing changes must be audited)
- Data classification: `s-set-r-004`

### Acceptance Criteria
- Admin can select a new plan; action is tenant-scoped and permission-gated.
- Billing change recorded and audited (success/failure).
- No payment secrets logged/returned.

### Definition of Done (DoD)
- Side effects (notifications/invoices) handled async if applicable; document if not in scope.
- Repo/global DoD applies.
