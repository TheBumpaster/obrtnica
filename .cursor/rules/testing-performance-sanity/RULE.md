---
alwaysApply: true
---

Performance regressions must be prevented through lightweight sanity checks.

---

## 1) When This Rule Applies

This rule applies when changes affect:
- Postgres queries, repositories, or DB schema
- reporting/dashboard endpoints
- worker consumers that may run at scale
- endpoints returning lists or analytics payloads

---

## 2) Minimum Required Tests

For applicable changes, Cursor must add at least one of:

### A) Query Count Guard (preferred when feasible)
- Add an integration test that asserts query count does not grow unbounded for a representative request/flow.
- The test must cover at least one list/query endpoint that could regress into N+1 behavior.

### B) Payload Size / Shape Guard
- Add an integration test that asserts response shape remains paginated and does not return unbounded arrays by default.
- Ensure endpoints default to pagination and limited fields.

### C) Projection Contract Guard (analytics)
- Add an integration test verifying the reporting endpoint:
  - reads from a projection (Mongo) when available
  - degrades gracefully (fallback behavior) when Mongo is unavailable
- Ensure the test asserts the endpoint does not crash when derived systems are down.

---

## 3) Test Discipline

- Do not weaken or remove existing tests to bypass failures.
- Tests must be deterministic (no real network calls).
- Use project-defined commands to run tests (`pnpm test`, `pnpm test:integration`).

If performance-sensitive changes ship without sanity tests, the task is NOT DONE.
