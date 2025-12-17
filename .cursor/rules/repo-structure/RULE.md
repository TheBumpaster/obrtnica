---
alwaysApply: true
---

- Business logic must live in `packages/core`. UI apps should remain thin.
- Validation schemas must live in `packages/validations` (Zod). Do not duplicate schemas in apps.
- tRPC contract/types/helpers belong in `packages/trpc`. Do not scatter router type logic.
- Adapters for runtime/platform specifics belong in `apps/api/adapters/*` (and worker equivalents).
- Analytics/read models belong in MongoDB projections; core workflows must not depend on Mongo.
