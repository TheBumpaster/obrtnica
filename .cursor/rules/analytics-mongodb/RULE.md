---
alwaysApply: true
---

- MongoDB stores derived projections only (dashboards/reporting/read models).
- Core business logic must not depend on MongoDB availability.
- Projections must be rebuildable from Postgres + events.
- Shape documents for fast reads; avoid heavy runtime aggregations where possible.
- Add/adjust Mongo indexes when introducing new projection query patterns.
- If Mongo is down: dashboards degrade gracefully; core app continues to function.
