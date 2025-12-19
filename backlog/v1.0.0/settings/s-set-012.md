## S-SET-012 — Remove a User from Organization

> As an organization admin, I want to remove a user so that they no longer have access.

### Scope
Org admin removal of member; revoke access without deleting historical data.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.users.remove`, last-admin protection)
- Audit: `s-set-r-003`
- Data classification: `s-set-r-004`

### Acceptance Criteria
- Admin can remove a member from the org; access revoked immediately.
- System prevents removing the last admin (org must retain at least one admin).
- Removal does not delete historical data; membership state reflects removal.
- Removal action is audited (success/failure).

### Definition of Done (DoD)
- Denied attempts (e.g., last admin) are explicit and auditable.
- Repo/global DoD applies.
