## S-SET-R-002 — Authorization Model & RBAC Contracts

### What this governs
Platform-owned permissions, org-owned roles, consistent permission checks, and preventing privilege lockout (no orphaned orgs).

### Depends / used by
RBAC manager stories (`S-SET-020`–`S-SET-023`), invites/membership, billing/security settings, logs, and any action requiring permissions.

### Constraints (from rules/docs)
- Settings epic §3.2 Authorization Model; §5 DoD (RBAC enforced everywhere)
- `.cursor/rules/auth-multitenancy/RULE.md`, `.cursor/rules/api-trpc/RULE.md`
- `.cursor/rules/security-review-gate/RULE.md` (auth/permissions changes)

### Acceptance Criteria
- Permissions are platform-defined; roles are org-defined; roles = set of permissions.
- Permission checks are middleware-enforced for every protected action.
- System prevents removing the last admin (no orphaned org) and prevents assigning invalid permissions.

### Definition of Done (DoD)
- Each dependent story plan lists required permissions and last-admin protection where relevant.
- Failure-path (permission denied) is covered and auditable for sensitive actions.
