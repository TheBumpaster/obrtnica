---
alwaysApply: true
---

Security and compliance depend on reliable audit logging.

## 1) Mandatory Audit Events
Audit events must be emitted for:
- Authentication events (login success/failure, logout, MFA actions, password reset)
- Authorization failures (permission denied)
- Role/membership changes
- Admin actions / impersonation (if applicable)
- Data export (GDPR) requests and completion/failure
- Data erasure/anonymization requests and completion/failure
- Configuration/security-relevant changes

## 2) Audit Log Properties
Audit logs must be:
- append-only (insert only)
- correlated (request_id/correlation_id)
- tenant-aware (tenant_id/org_id when applicable)
- actor-aware (user/service/system)
- minimal (IDs over payload content)
- free of secrets and PHI content

## 3) Implementation Rules
- For security-critical events, log in the same request flow (or via transactional outbox).
- Worker-based actions must also log audit events for success/failure.
- Audit metadata must be sanitized (never log tokens/passwords/OTPs).

## 4) Tests
Any feature that adds/modifies audit behavior must include:
- a success-path test verifying audit event insert
- a failure-path test verifying audit event insert
- at least one tenant boundary/permission test
