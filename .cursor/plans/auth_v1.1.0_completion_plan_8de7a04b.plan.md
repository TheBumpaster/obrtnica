---
name: Auth v1.1.0 Completion Plan
overview: Fix critical gaps in Workspace RBAC middleware integration, implement missing integration tests, and finalize documentation to meet v1.1.0 requirements.
todos:
  - id: fix-loader
    content: Fix PermissionLoader to load workspace permissions correctly
    status: completed
  - id: update-middleware
    content: Update tRPC middleware to pass workspace context to loader
    status: completed
    dependencies:
      - fix-loader
  - id: test-auth
    content: Implement auth.test.ts integration tests
    status: completed
    dependencies:
      - update-middleware
  - id: test-rbac
    content: Implement rbac.test.ts integration tests (org & workspace)
    status: completed
    dependencies:
      - fix-loader
      - update-middleware
  - id: test-others
    content: Implement emergency-access.test.ts & tokens.test.ts
    status: completed
    dependencies:
      - update-middleware
  - id: update-docs
    content: Update documentation to reflect actual status
    status: completed
    dependencies:
      - test-auth
      - test-rbac
---

# Auth v1.1.0 Completion Plan

## Gaps Identification (Verified)

Based on a review of the codebase and requirements:

1.  **Workspace RBAC is Incomplete (Critical)**

    -   **Issue**: `apps/api/src/services/permission-loader.ts` returns an empty map for `loadUserWorkspacePermissions`.
    -   **Issue**: `packages/trpc/src/middleware.ts` calls `permissionLoader` without `workspaceId`, causing `userPermissions` to lack workspace context even if `requirePermission` is called with a `workspaceId`.
    -   **Impact**: Any workspace-scoped permission check will fail.

2.  **Integration Tests are Missing (DoD Violation)**

    -   **Issue**: `apps/api/src/router/auth.test.ts` and other router tests contain only `// TODO: Implement test` scaffolds.
    -   **Impact**: Violates "Definition of Done" and "Testing" rules. No verification of auth flows, session management, or tenant boundaries.

3.  **Emergency Access Justification Exposure**

    -   **Issue**: `listEmergencyGrants` returns raw `justification` string.
    -   **Requirement**: "Minimal/no PHI" in audit. While audit logging is safe (explicitly excluded), the API response exposes it.
    -   **Plan**: Review if this is acceptable for the UI or if we should mask/hash it.

4.  **Service Account Verification**

    -   **Status**: Code implementation exists in `PermissionLoader`, but lack of tests prevents verifying if it works end-to-end.

## Implementation Plan

### Phase 1: Fix Workspace RBAC Middleware

**Goal**: Ensure workspace-scoped permissions are correctly loaded and enforced.

1.  **Update `PermissionLoader` in `apps/api/src/services/permission-loader.ts`**:

    -   Implement `loadUserWorkspacePermissions` to load *all* workspace memberships for a user in an org (or optimize to load on demand).
    -   Ensure `buildUserPermissions` populates `workspacePermissions`.

2.  **Update `middleware.ts`**:

    -   Pass `workspaceId` (if available) to the permission loader.
    -   Update `PermissionLoaderFn` signature to accept `workspaceId`.

### Phase 2: Implement Integration Tests (Critical Gate)

**Goal**: Verify all auth requirements and hit 100% coverage for routers.

1.  **Implement `auth.test.ts`**:

    -   Register, Login, Session creation.
    -   Refresh token rotation & reuse detection.
    -   Logout (session revocation).

2.  **Implement `rbac.test.ts`**:

    -   Org role creation/assignment.
    -   Workspace role creation/assignment (verifying Phase 1 fix).
    -   Permission enforcement checks.

3.  **Implement `emergency-access.test.ts`**:

    -   Activation flow (step-up requirement).
    -   Justification handling.

4.  **Implement `tokens.test.ts`**:

    -   Service account authentication & permission checks.

### Phase 3: Hardening & Documentation

**Goal**: Finalize security posture and align docs.

1.  **Emergency Access**:

    -   Keep `justification` in API response (needed for approval/review) but add comment/doc warning frontend to handle carefully.

2.  **Docs**:

    -   Update `docs/implementation-summaries/auth-v1.1.0-status.md` to reflect "Testing" and "RBAC Fixes" as remaining work.
    -   Mark v1.1.0 as DONE only after tests pass.

### Phase 4: Verification

1.  Run `pnpm test` (all unit + integration tests).
2.  Run `pnpm verify`.