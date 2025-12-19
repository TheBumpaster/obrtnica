## S-SET-011 — Accept an Invitation

> As an invited user, I want to accept an invitation so that I can join the organization.

### Scope
Invite acceptance, account linkage, role assignment, token verification.

### Dependencies
- Tenancy: `s-set-r-001`
- RBAC: `s-set-r-002` (role assignment rules)
- Audit: `s-set-r-003`
- Data classification/secrets: `s-set-r-004` (invite tokens RESTRICTED)
- Notifications pipeline: `s-set-r-005` (confirmation emails optional)

### Acceptance Criteria
- Invite acceptance validates token (unexpired, unused, org-scoped).
- User is added to org with assigned role(s); cannot bypass permission model.
- Token cannot be reused; invalid/expired attempts are rejected and auditable.

### Definition of Done (DoD)
- No token values logged; failure paths are safe.
- Audit event for acceptance (actor, org, invitation id).
- Repo/global DoD applies.
