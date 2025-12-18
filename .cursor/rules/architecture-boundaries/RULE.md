---
alwaysApply: true
---

This repository enforces strict architectural boundaries to maintain quality and portability.

---

## 1) Where Logic Lives

- `packages/core`:
  - domain/business logic only (UI-agnostic)
  - may define interfaces/ports for external systems (storage, messaging, providers)
  - must not depend on `apps/*`

- `packages/validations`:
  - Zod schemas and validation utilities only

- `packages/trpc`:
  - shared tRPC types/helpers only (no business logic)

- `apps/api`:
  - tRPC routers and runtime adapters
  - orchestration only; must call `packages/core` for domain logic

- `apps/worker`:
  - queue consumers and background jobs
  - orchestration only; must call `packages/core` for domain logic

- `apps/client`:
  - UI only (Next.js with Electron build target)
  - must not contain business rules beyond presentation and UX

---

## 2) Forbidden Dependencies

Cursor must NOT introduce:
- UI apps importing database code, Drizzle schemas, or repositories directly
- `packages/core` importing from any `apps/*`
- business logic inside tRPC routers (routers orchestrate; services implement)
- direct provider calls (Mailjet/Twilio/FCM/APNs) from UI or request handlers

---

## 3) Adapter/Provider Boundaries

All external providers must be behind adapters:
- Mailjet adapter
- Twilio adapter
- FCM/APNs adapter
- Storage adapter for exports (S3-compatible/MinIO/etc.)

Domain code calls interfaces; apps provide implementations.

---

## 4) Enforcement & Documentation

If Cursor must break a boundary for a valid reason:
- it must be explicitly documented in `docs/decisions/`
- it must include a follow-up backlog item to correct it

Otherwise, the work is NOT DONE.
