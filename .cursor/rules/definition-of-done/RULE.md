---
alwaysApply: true
---

A task is considered **DONE** only if **all** of the following are satisfied.

### 1) Scope & Intent
- The implementation matches the task description exactly.
- No unrelated refactors, library swaps, or architectural changes were introduced.
- Changes are minimal and localized; large diffs are justified in the summary.

### 2) Code Quality
- Code follows existing project patterns and folder structure.
- No business logic exists outside `packages/core`.
- No duplicated validation, auth, or tenant-scoping logic.
- No commented-out code or debug artifacts remain.

### 3) Type Safety & Validation
- TypeScript strict mode passes without errors.
- No new `any`, `@ts-ignore`, or `@ts-expect-error` unless explicitly justified.
- All external inputs are validated using shared Zod schemas.

### 4) Data & Consistency
- Postgres remains the system of record.
- Any async side effects (analytics, notifications, projections) are failure-safe.
- If events/jobs are introduced, they are idempotent and versioned.
- MongoDB usage (if any) is strictly derived and rebuildable.

### 5) Testing
- New or modified business logic includes unit tests.
- New or modified API procedures include integration tests.
- New or modified workers/consumers include integration tests.
- Tests cover at least:
  - success path
  - failure path
  - permission / tenant boundary
- No existing tests were weakened or removed without justification.

### 6) Local Verification
Before marking done, the following must pass for affected packages/apps:
- lint
- typecheck
- test (unit + integration where applicable)
- build

### 7) Observability & Safety
- Errors are handled explicitly (no silent failures).
- Logs are structured and do not include sensitive data.
- Correlation/request IDs are preserved where applicable.

### 8) Documentation
- Any system-level change updates relevant docs:
  - architecture
  - runbook
  - events/contracts (if applicable)
- Behavior and failure modes are documented briefly and clearly.

### 9) Final Review Checklist
- Auth and multi-tenancy were not bypassed.
- Offline/derived systems failing does not break core flows.
- No secrets or credentials were introduced.
- The system remains deployable in both containerized and serverless contexts.
- Always finish the task by running `pnpm verify` command

If **any** item above is not satisfied, the task is **NOT DONE**.
