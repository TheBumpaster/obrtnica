## S-SET-023 — Prevent Removing the Last Admin

> As the system, I must prevent removing the last admin role to avoid orphaned organizations.

### Scope
Protect against loss of administrative access in an org.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002`
- Audit: `s-set-r-003`

### Acceptance Criteria
- System rejects user removal or role changes that would leave org without an admin.
- Rejection reason is clear and auditable.
- Applies across user removal, role removal, and demotion flows.

### Definition of Done (DoD)
- Protection is consistently enforced in all relevant flows.
- Repo/global DoD applies.
