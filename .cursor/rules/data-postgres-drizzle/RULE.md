---
alwaysApply: true
---

- Postgres is the system of record. Losing Postgres data is unacceptable.
- Use Drizzle for schema + migrations; keep migrations deterministic and reversible where possible.
- Use stable IDs (UUID/ULID). Do not introduce mixed ID strategies.
- Ensure `created_at`, `updated_at` are present on primary entities; use soft delete (`deleted_at`) where appropriate.
- For multi-step writes, use transactions.
- If emitting events for async processing, use a transactional outbox pattern (avoid dual-write bugs).
