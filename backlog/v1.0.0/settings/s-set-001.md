## S-SET-001 — View & Update Personal Profile

> As a user, I want to view and update my personal profile information so that my account details stay accurate.

### Scope
User self-service profile (name, email with verification flow).

### Dependencies
- Tenancy/auth: `s-set-r-001`
- RBAC: `s-set-r-002` (`user.profile.manage`)
- Audit: `s-set-r-003` (sensitive profile changes)
- Data classification: `s-set-r-004` (**CONFIDENTIAL**; no secrets in logs)

### Acceptance Criteria
- User can view and update name and email (email change requires verification).
- Updates are tenant-scoped to the user’s memberships.
- Unauthorized users are denied (auth + permission).
- Sensitive changes (email) emit audit events with safe metadata.

### Definition of Done (DoD)
- Classification noted: profile data = CONFIDENTIAL; audit events = RESTRICTED.
- No tokens/verification secrets logged.
- Repo/global DoD applies.
