---
alwaysApply: true
---

- Any new domain logic in `packages/core` requires unit tests.
- Any new tRPC procedure requires an integration test (API + Postgres at minimum).
- Any new worker consumer requires an integration test (RabbitMQ + Postgres, and Mongo if projection-related).
- Bug fixes must include a regression test (or add one alongside the fix).
- Tests should be deterministic: avoid real network calls; use mocks/adapters where needed.
