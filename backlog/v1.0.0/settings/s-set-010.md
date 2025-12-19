## S-SET-010 — Invite a User to Organization

> As an organization admin, I want to invite a user so that they can access the organization.

### Scope
Org admin sends invite; invite token/email delivery via async pipeline.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (`org.users.invite`)
- Audit: `s-set-r-003`
- Data classification/secrets: `s-set-r-004` (invite tokens RESTRICTED)
- Notifications pipeline: `s-set-r-005`

### Acceptance Criteria
- Admin can create an invitation specifying email and initial role(s).
- Invite token/links are generated and delivered via async queue; not logged.
- Invitation is tenant-scoped; cannot invite into another org.
- Audit event on invite creation (safe metadata).

### Definition of Done (DoD)
- Token secrecy upheld (never logged; stored hashed if stored).
- Expiry/one-time-use policy defined.
- Repo/global DoD applies.
