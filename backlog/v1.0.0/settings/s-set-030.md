## S-SET-030 — View Current Subscription

> As an organization admin, I want to view my current subscription so that I understand my limits.

### Scope
Read-only subscription details: plan, limits, billing period.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.billing.view`)
- Audit (read may be logged per policy): `s-set-r-003`
- Data classification: `s-set-r-004` (**CONFIDENTIAL** billing info)

### Acceptance Criteria
- Admin can view plan, usage limits, billing period for the org.
- Data is tenant-scoped; unauthorized users denied.
- Response is read-only and does not expose secrets/payment tokens.

### Definition of Done (DoD)
- Classification documented; no sensitive payment tokens returned or logged.
- Repo/global DoD applies.
