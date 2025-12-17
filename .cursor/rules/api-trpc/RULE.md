---
alwaysApply: true
---

- All API endpoints must be implemented as tRPC procedures unless explicitly instructed otherwise.
- Every procedure must:
  - validate input with Zod schemas from `packages/validations`
  - enforce auth + tenant scope via middleware (not inside handler bodies)
  - call domain services from `packages/core` (routers orchestrate; services implement)
- No business logic in routers. No direct DB writes from UI apps.
- Public procedures must be explicitly marked and reviewed (default is protected).
