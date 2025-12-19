## S-SET-032 — Update Billing Details

> As an organization admin, I want to update billing details so that payments succeed.

### Scope
Manage billing info (e.g., payment method metadata, billing address) without exposing secrets.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.billing.manage`)
- Audit: `s-set-r-003`
- Data classification: `s-set-r-004` (billing info CONFIDENTIAL; payment tokens RESTRICTED and handled by provider)

### Acceptance Criteria
- Admin can update billing details; action is auditable.
- No raw payment instrument details stored or logged; tokenization via provider if applicable.
- Unauthorized attempts are denied.

### Definition of Done (DoD)
- Classification and secret-handling explicitly stated.
- Repo/global DoD applies.
