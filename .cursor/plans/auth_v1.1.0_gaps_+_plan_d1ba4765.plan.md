---
name: Auth v1.1.0 gaps + plan
overview: Review v1.1.0 auth requirements, existing plans, project rules, and current code/docs; identify remaining gaps (esp. testing, workspace RBAC, service-account permissions, sensitive-data handling); propose an implementation plan aligned with repo boundaries + DoD/quality gates.
todos:
  - id: svcacct-perms
    content: Implement service-account permission loading in PermissionLoader + remove TODO empty permission behavior in requirePermission middleware.
    status: completed
  - id: workspace-rbac
    content: "Implement workspace RBAC end-to-end: workspace CRUD/memberships/roles, populate workspacePermissions in PermissionLoader, and enforce via requirePermission where needed."
    status: completed
    dependencies:
      - svcacct-perms
  - id: integration-tests
    content: Replace API router integration test scaffolds with working integration tests covering success/failure/tenant-boundary/audit inserts for auth/rbac/tokens/emergency-access.
    status: completed
    dependencies:
      - svcacct-perms
      - workspace-rbac
  - id: docs-align
    content: Align docs/implementation-summaries auth v1.1.0 status/FINAL-STATUS with actual code and document failure modes/testing per security-review gate.
    status: completed
    dependencies:
      - integration-tests
  - id: verify-gate
    content: Run or instruct running project verification scripts (prefer pnpm verify) and record outcomes as the completion gate.
    status: completed
    dependencies:
      - docs-align
---

# Auth v1.1.0 Gap Assessment + Implementation Plan

## Constraints / what I could not do

- You asked to map gaps to **files added/modified per `git status`**, but you selected that you **can’t provide git status output**. I therefore cannot reliably attribute gaps to “changed files”; instead this is a **repo-wide implementation gap report** grounded in current code + docs.

## Sources reviewed

- Plans
- `.cursor/plans/auth_v1.1.0_implementation_a98f9c3b.plan.md`
- `.cursor/plans/auth_v1.1.0_gap-to-done_100de2c8.plan.md`
- Requirements
- `backlog/v1.1.0/auth/requirement_1.md`
- Project rules
- `.cursor/rules/definition-of-done/RULE.md`
- `.cursor/rules/architecture-boundaries/RULE.md`
- `.cursor/rules/security/RULE.md`
- `.cursor/rules/auth-multitenancy/RULE.md`
- `.cursor/rules/audit-logging/RULE.md`
- `.cursor/rules/testing/RULE.md`
- `.cursor/rules/quality-gates/RULE.md`
- `.cursor/rules/security-review-gate/RULE.md`
- Docs context
- `docs/implementation-summaries/auth-v1.1.0-FINAL-STATUS.md`
- `docs/implementation-summaries/auth-v1.1.0-status.md`
- `docs/implementation-summaries/auth-v1.1.0-COMPLETE.md`

## High-signal findings (what is already implemented)

### AuthN (requirement coverage)

- **Email+password**: implemented in `apps/api/src/router/auth.ts` calling `packages/core/src/services/auth/auth-domain.ts`.
- **Sessions + refresh rotation + reuse detection**: implemented in `packages/core/src/services/auth/auth-domain.ts`.
- **Email verification**: `auth.verifyEmail` exists and updates `emailVerifiedAt` in core.
- **Password reset**: `auth.requestPasswordReset` + `auth.resetPassword` exist.
- **Passwordless**: `auth.requestMagicLink`/`consumeMagicLink` and `auth.requestOtp`/`verifyOtp` exist.
- **Rate limiting**: Postgres-backed `apps/api/src/services/rate-limiter.ts` and applied to login/password-reset/magic-link/otp in `apps/api/src/router/auth.ts`.

### AuthZ / RBAC

- **Permission catalog + engine**: `packages/core/src/auth/permissions.ts` + `packages/core/src/auth/authorize.ts`.
- **tRPC enforcement**: `packages/trpc/src/middleware.ts` implements `requirePermission()` and uses core engine.
- **Applied in routers**: org role management (`apps/api/src/router/rbac.ts`), API token management (`apps/api/src/router/tokens.ts`), emergency access activation/listing (`apps/api/src/router/emergency-access.ts`).
- **Tenant boundary**: principal/org in context (`apps/api/src/adapters/express.ts`), and permission loader checks org membership.

### Workers / notifications

- Auth notification consumers exist:
- `apps/worker/src/consumers/auth-email-consumer.ts`
- `apps/worker/src/consumers/auth-otp-consumer.ts`
- routed by `apps/worker/src/consumers/auth-events-consumer.ts`

## What is NOT DONE vs requirements + project rules

### 1) **Integration tests are mostly TODO scaffolds (DoD violation)**

- Rule requires: new/modified API procedures + workers must have integration tests (`.cursor/rules/definition-of-done/RULE.md`, `.cursor/rules/testing/RULE.md`).
- Evidence: router test files contain many `// TODO: Implement test` markers:
- `apps/api/src/router/auth.test.ts`
- `apps/api/src/router/rbac.test.ts`
- `apps/api/src/router/tokens.test.ts`
- `apps/api/src/router/emergency-access.test.ts`
- This is the clearest “not implemented” gap and blocks calling v1.1.0 “DONE” per repo rules.

### 2) **Workspace RBAC is not implemented end-to-end**

- Requirement mandates workspace roles + workspace-scoped permission enforcement (`backlog/v1.1.0/auth/requirement_1.md`).
- Evidence:
- Permission catalog includes workspace permissions in `packages/core/src/auth/permissions.ts`.
- Workspace tables exist under `packages/db/src/schema/workspaces/*`.
- But `apps/api/src/services/permission-loader.ts` explicitly has: `// TODO: Load workspace permissions when workspace RBAC is implemented` and currently returns an empty workspace map.
- No workspace routers found (no `apps/api/src/router/workspaces.ts`), and no repo implementation for workspace role assignments.
- Result: any workspace-scoped permissions will be denied or unusable; v1.1.0 workspace RBAC DoD is not met.

### 3) **Service-account permission loading is TODO (AuthZ gap)**

- Requirement: service accounts must be assigned roles; permissions evaluated; human-only permissions denied for service actors.
- Evidence:
- `apps/api/src/adapters/express.ts` supports `api_...` tokens and sets principal type `service`.
- Core engine enforces `humanOnly` properly (`packages/core/src/auth/authorize.ts`).
- But `packages/trpc/src/middleware.ts` has an explicit TODO:
  - service accounts are given **empty permissions**.
- Result: service accounts will be authenticated but effectively cannot perform any permission-guarded actions (or will be denied). This violates the requirement’s “service accounts are assigned roles like users”.

### 4) **Emergency access listing returns raw justification (potential rules issue)**

- Requirement says justification is required but audit must be minimal/no PHI.
- Router `apps/api/src/router/emergency-access.ts` avoids logging justification in audit metadata, good.
- However `listEmergencyGrants` returns `justification` to the caller. That may be acceptable for owners, but it should be considered **sensitive** and access-controlled; also ensure it’s not printed/logged elsewhere.
- This needs an explicit decision: should clients ever see raw justification, or only metadata (length/hash) plus separately stored secure notes?

### 5) **Docs are inconsistent with code reality**

- `docs/implementation-summaries/auth-v1.1.0-FINAL-STATUS.md` claims “complete and production ready”.
- `docs/implementation-summaries/auth-v1.1.0-status.md` acknowledges remaining work.
- Code shows real remaining gaps: tests, workspace RBAC, service-account permissions.
- Per `.cursor/rules/documentation/RULE.md`, this should be aligned.

## Implementation plan (aligned with boundaries + DoD)

### Phase 0 — Align on scope (no code yet)

- Decide whether v1.1.0 must include **workspace RBAC** fully (per requirement, default **yes**).
- Decide desired behavior for **emergency access justification exposure** in `listEmergencyGrants`.

### Phase 1 — Fix service-account permission loading (core requirement)

- **Goal**: service principals should have permissions derived from org roles (and optionally workspace roles) without duplicating business logic in routers.
- Update/extend:
- `apps/api/src/services/permission-loader.ts`: add loaders for service accounts (via `service_accounts` + role assignment tables).
- `packages/trpc/src/middleware.ts`: replace TODO empty perms with loader call.
- Add unit tests in `packages/core` only if core logic changes; otherwise integration tests in API.

### Phase 2 — Implement workspace RBAC end-to-end

- **Goal**: enforce workspace-scoped permissions per requirement.
- Add domain + repo support:
- Extend `packages/core/src/services/rbac/rbac-domain.ts` and `apps/api/src/repositories/rbac-repository.ts` to support:
  - creating workspaces
  - workspace memberships
  - workspace roles
  - assigning workspace roles to workspace members
  - querying workspace permissions for a user/service principal
- Extend `apps/api/src/services/permission-loader.ts` to populate `workspacePermissions` map.
- Add a `workspaces` router (or extend `rbac` router) for workspace CRUD and membership/role assignment.

### Phase 3 — Integration tests to satisfy DoD + audit rules (highest priority gate)

- Implement integration tests (not scaffolds) for:
- `apps/api/src/router/auth.test.ts`: register/login/refresh/logout, email verify, password reset, magic link, OTP, rate limiting behavior (non-enumerable responses).
- `apps/api/src/router/rbac.test.ts`: role create/assign/remove, permission enforcement.
- `apps/api/src/router/tokens.test.ts`: create token, authenticate with `api_` bearer, human-only enforcement.
- `apps/api/src/router/emergency-access.test.ts`: activation requires step-up, audit event emitted, listing requires permission.
- Ensure tests include **tenant boundary** cases and **audit insert** assertions per `.cursor/rules/audit-logging/RULE.md`.

### Phase 4 — Documentation alignment + security-review gate output

- Update the v1.1.0 docs to reflect actual status and remaining work:
- `docs/implementation-summaries/auth-v1.1.0-FINAL-STATUS.md`
- `docs/implementation-summaries/auth-v1.1.0-status.md`
- Add a short “security review gate” section (data categories/classification, audit events, failure modes, how to test) per `.cursor/rules/security-review-gate/RULE.md`.

### Phase 5 — Verify via project commands

- Run (or instruct running) repo scripts: `pnpm verify` (preferred), otherwise `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` per `.cursor/rules/project-commands/RULE.md`.

## Suggested execution order

1. Service-account permission loading
2. Workspace RBAC end-to-end
3. Integration tests
4. Docs alignment + security-review gate notes
5. Final `pnpm verify`

## Implementation todos

- `svcacct-perms`: Implement service-account permission loading (remove TODO empty perms) and add coverage.
- `workspace-rbac`: Implement workspace membership/roles/permission loading + router endpoints.
- `integration-tests`: Convert router test scaffolds into real integration tests with tenant/audit assertions.
- `docs-align`: Align v1.1.0 status docs with code reality + add security-review gate section.
- `verify-gate`: Run/instruct `pnpm verify` and capture results.