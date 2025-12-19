## S-SET-R-003 — Audit Logging for Settings

### What this governs
Audit requirements for sensitive Settings actions: invites/removals, role changes, billing/security config changes, access/activity logs access.

### Depends / used by
Invite/remove (`S-SET-010`–`012`), roles (`S-SET-020`–`023`), billing (`S-SET-030`–`032`), security (`S-SET-040`–`041`), integrations (`S-SET-050`–`051`), logs (`S-SET-060`–`061`).

### Constraints (from rules/docs)
- Settings epic §3.3 Audit & Compliance
- `.cursor/rules/audit-logging/RULE.md`, `docs/compliance/procedures/audit-logging.md`
- Forbidden metadata: no secrets/tokens/OTPs/headers in audit payloads.

### Acceptance Criteria
- Sensitive actions emit audit events (success + failure where meaningful) including actor, org, resource, action, request/correlation id.
- Audit log is append-only; no updates/deletes.
- Audit events contain only safe metadata (ids/summary), never secrets.

### Definition of Done (DoD)
- Each dependent story plan states whether/how it emits audit events.
- Data classification for audit events: **RESTRICTED + AUDIT**.
- Repo DoD gates apply.
