---
alwaysApply: true
---

The API must follow MVP-friendly patterns: simple, explicit, testable, and scalable.

Applies to:
- apps/api (tRPC server + adapters)

---

## 1) API Structure (Required)

API must be organized into:
- `routers/` (tRPC routers only; no business logic)
- `middlewares/` (auth, tenant scope, permissions, rate limiting hooks)
- `context/` (request context creation; actor/tenant/correlation IDs)
- `adapters/` (express/serverless runtime wiring)
- `services/` (API orchestration helpers; thin)
- `repositories/` (ONLY if needed in API; prefer core services + infra repos)
- `errors/` (standard error mapping)

Rules:
- Routers orchestrate only.
- Core business logic lives in `packages/core`.

---

## 2) MVP Patterns (Keep It Simple)

- Prefer explicit procedures over meta-programming.
- Avoid premature abstraction (no “router builders” unless necessary).
- Avoid framework sprawl: do not add new server frameworks/libraries unless instructed.

---

## 3) Procedure Requirements

Every tRPC procedure must:
- validate input using Zod from `packages/validations`
- enforce auth + tenant + permissions via middleware (not inline)
- call a domain service from `packages/core`
- return minimal payloads (only what UI needs)

---

## 4) API Must Not Block on Side Effects

- Notifications, analytics projection writes, and external provider calls must be async via RabbitMQ.
- If a request triggers side effects:
  - enqueue a job/event
  - return quickly
- Exceptions must be explicitly documented in `docs/decisions/`.

---

## 5) Tests & Docs

- New procedures require integration tests.
- Any change to auth/tenancy/permissions requires tests and audit events.
- System-level API changes must update `docs/runbook.md` and/or architecture docs.
