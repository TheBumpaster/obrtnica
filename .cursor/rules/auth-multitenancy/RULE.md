---
alwaysApply: true
---

- Multi-tenancy is mandatory: every data access must be scoped by tenant/org.
- Never trust client-supplied tenant identifiers without server-side verification.
- AuthN (identity) and AuthZ (permissions/RBAC) must be enforced consistently in middleware.
- Never bypass auth checks “temporarily” to unblock development.
- Never log secrets, tokens, OTPs, or sensitive personal data.
