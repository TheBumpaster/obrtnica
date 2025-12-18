---
name: Auth UI v1.2.0 (Web+Desktop)
overview: Re-scope requirement_3 to Web+Desktop only with an explicit parity exception, keep shared auth flow + session handling, implement all required auth pages on Web (Next.js) and Desktop (shadcn), and restore strict type-safety by importing `AppRouter` from the built `@serp/api` package (no `any`).
todos:
  - id: docs-parity-exception
    content: Add `docs/decisions/` parity exception and `docs/changes/` scope deviation for requirement_3 now that mobile is removed.
    status: completed
  - id: approuter-from-api-build
    content: Make `@serp/api` export `AppRouter` from its built entrypoint and update Web/Desktop tRPC clients to type against `import type { AppRouter } from '@serp/api'` (no `any`, no TS path hacks).
    status: completed
    dependencies:
      - docs-parity-exception
  - id: finish-session-provider
    content: Finish SessionProvider/useSession on Web+Desktop with refresh-on-401 loop prevention and returnTo redirect rules.
    status: completed
    dependencies:
      - approuter-from-api-build
  - id: web-auth-pages
    content: Implement Web auth routes (login/register/verify/forgot/reset/mfa/sessions/step-up + magic consume) using shadcn (MCP-first) and shared auth-flow layer.
    status: completed
    dependencies:
      - finish-session-provider
  - id: desktop-auth-pages
    content: Implement Desktop auth screens matching Web (same flows), integrated into desktop shell/login gating and returnTo handling, using shadcn.
    status: cancelled
    dependencies:
      - finish-session-provider
  - id: auth-tests-and-qa
    content: Add unit tests for auth-flow error mapping/refresh guard and create `docs/auth-qa.md` checklist for Web+Desktop flows.
    status: completed
    dependencies:
      - web-auth-pages
      - desktop-auth-pages
---

# Auth UI v1.2.0 (Web+Desktop)

## Scope (binding + deviation handling)

- **Backlog source**: [`backlog/v1.2.0/ui/requirement_3.md`](backlog/v1.2.0/ui/requirement_3.md)
- **Deviation**: Requirement mandates **Web + Desktop + Mobile parity**, but `apps/mobile` is removed. We will implement **Web + Desktop only** and make this compliant by:
- Creating an explicit parity exception in `docs/decisions/` (required by repo rules)
- Recording the scope deviation in `docs/changes/` (required when reality diverges from backlog)

## Non-negotiables from repo rules

- **No `any`** in tRPC client typing; use real `AppRouter` type.
- **UI parity between Web + Desktop** for all user-facing auth flows.
- **Web/Desktop UI** must use **shadcn/ui** and follow **MCP-first** install workflow.
- **No backend rewrites**: reuse existing `auth.*` tRPC procedures.
- **No secrets in logs**: never log tokens, OTPs, recovery codes.

## Key technical decisions (confirmed)

- **Mobile**: out of scope; handled via documented exception.
- **AppRouter type source**: UI imports `AppRouter` from the **built** `@serp/api` package: `import type { AppRouter } from '@serp/api'`.

## Implementation outline

### 1) Documentation gates (make scope rule-compliant)

- Add decision doc: `docs/decisions/v1.2.0-auth-ui-parity-exception.md`
- Explain why mobile is excluded (mobile removal)
- User impact
- Whether/when mobile returns
- Add change log: `docs/changes/v1.2.0-requirement-3-scope.md`
- Explicitly state requirement_3 parity deviation and rationale

### 2) Ensure `@serp/api` exports `AppRouter` types (no TS path hacks)

- Confirm `apps/api` build emits `dist/index.d.ts`.
- Export `AppRouter` from the public entrypoint (e.g. `apps/api/src/index.ts`).
- Ensure `apps/api/package.json` exposes types (`types` field + exports map if repo uses it).
- Update Web/Desktop tRPC client factories to:
- `import type { AppRouter } from '@serp/api'`
- `createTRPCProxyClient<AppRouter>(...)`

### 3) Shared auth flow layer (no UI)

- Keep/finish `packages/auth-flow` as the shared non-UI layer:
- `AuthError` normalized shape
- `mapTrpcErrorToAuthError`
- Thin wrappers around existing `auth.*` procedures
- Re-export auth zod schemas from `packages/validations`

### 4) Session handling (Web + Desktop)

- Implement/finish a `SessionProvider` per app (or a shared minimal module if it already exists) with:
- `status: loading|authenticated|unauthenticated`
- `tokens` management
- refresh-on-401 strategy with loop prevention
- redirect rules (`returnTo`)

### 5) Web auth routes (Next.js App Router)

Implement these routes under `apps/web/src/app/` (per requirement_3):

- `/login` (tabs: Password / OTP / Magic Link)
- `/register`
- `/verify` (email + phone verification)
- `/forgot-password`
- `/reset-password?token=...`
- `/mfa`
- `/sessions`
- `/step-up`
- Magic link consume route (token from query) per existing routing conventions

**UI requirements**:

- shadcn layout (Card/Button/Input/Label/Tabs/Alert/Separator/Dialog)
- resend timers for OTP/magic
- robust loading + inline field errors

### 6) Desktop auth screens (Electron renderer)

Implement the same screen set in `apps/desktop` using shadcn components.

- Integrate with existing desktop shell/login gating (`ShellOrLogin`)
- Add `returnTo` handling equivalent to web

### 7) Tests + QA doc

- Unit tests:
- `packages/auth-flow`: `mapTrpcErrorToAuthError` and any refresh-loop guard logic
- Docs:
- `docs/auth-qa.md` checklist for **Web + Desktop** flows

### 8) Verification gate