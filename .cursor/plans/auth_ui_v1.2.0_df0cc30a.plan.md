---
name: Auth UI v1.2.0
overview: Implement full cross-platform auth screens and flow wiring (password, OTP, magic link, email/phone verification, password reset, MFA, step-up, sessions) using existing tRPC procedures, with a shared non-UI flow layer and strict grayscale theming.
todos:
  - id: auth-flow-package
    content: Create `packages/auth-flow` with AuthError normalization, TRPC error mapping, schema re-exports, and a thin API wrapper around existing `auth.*` procedures.
    status: completed
  - id: session-provider
    content: Implement SessionProvider/useSession per platform (web/desktop/mobile) with refresh-on-401 strategy and redirect rules; mobile persists tokens via expo-secure-store.
    status: in_progress
    dependencies:
      - auth-flow-package
  - id: web-auth-pages
    content: Implement all required web routes under `apps/web/src/app/*` using shadcn auth layout and shared flow layer (login tabs, register, verify, forgot/reset, magic consume, mfa, step-up, sessions).
    status: pending
    dependencies:
      - session-provider
  - id: desktop-auth-pages
    content: Implement desktop auth screens with shadcn components and shared flow layer (same pages as web), integrated with desktop shell navigation and returnTo handling.
    status: pending
    dependencies:
      - session-provider
  - id: mobile-auth-stack
    content: Implement Expo Router AuthStack screens with RN grayscale kit, deep link handlers for magic/verify/reset, and wire to shared flow layer.
    status: pending
    dependencies:
      - session-provider
  - id: auth-tests-and-qa
    content: Add unit tests for error mapping + refresh logic and a `docs/auth-qa.md` smoke checklist covering all flows.
    status: pending
    dependencies:
      - auth-flow-package
      - session-provider
      - web-auth-pages
      - desktop-auth-pages
      - mobile-auth-stack
---

# Auth Screens + OTP/Magic Link + Verification + MFA (v1.2.0)

## Scope (from `backlog/v1.2.0/ui/requirement_3.md`)

Implement the **same auth flows** on **Web (Next.js)**, **Desktop (Electron/Vite)**, and **Mobile (Expo RN)**:

- Login (Password + OTP + Magic Link)
- Register (org + user)
- Verify (email + phone)
- Forgot password + Reset password
- MFA enroll/verify + recovery codes + disable MFA
- Step-up authentication screen (UI gate)
- Sessions list + revoke
- Logout + refresh-token integration

## What already exists in this repo (important constraints)

- **Backend procedures already exist** in `apps/api/src/router/auth.ts`:
- `auth.login`, `auth.register`, `auth.refresh`, `auth.logout`
- `auth.requestEmailVerification`, `auth.verifyEmail`
- `auth.requestPasswordReset`, `auth.resetPassword`
- `auth.requestMagicLink`, `auth.consumeMagicLink`
- `auth.requestOtp`, `auth.verifyOtp`
- `auth.enrollMfa`, `auth.verifyMfaEnrollment`, `auth.generateRecoveryCodes`, `auth.verifyMfa`, `auth.disableMfa`
- `auth.stepUp`
- `auth.listSessions`, `auth.revokeSession`
- `auth.requestPhoneVerification`, `auth.verifyPhone`
- **Validation schemas already exist** in [`packages/validations/src/auth.ts`](packages/validations/src/auth.ts) (email/password/otp/phone formats).
- **Current clients**:
- Web has a simple password login page at [`apps/web/src/app/login/page.tsx`](apps/web/src/app/login/page.tsx) and token storage in localStorage via [`apps/web/src/lib/auth-storage.ts`](apps/web/src/lib/auth-storage.ts).
- Desktop has an embedded login form in [`apps/desktop/src/App.tsx`](apps/desktop/src/App.tsx) and localStorage token storage in [`apps/desktop/src/context/auth-context.tsx`](apps/desktop/src/context/auth-context.tsx).
- Mobile has `login.tsx` password flow and **no persistent secure token storage yet**.

## Key decisions locked in (from your answers)

- **Mobile token storage**: use `expo-secure-store`.
- **Deep link + URL defaults**:
- Web: `http://localhost:3000/...` routes with token in query.
- Mobile: `serp://...` (Expo linking) deep links with token in query.

---

## Implementation Plan (follow the spec order)

## 1) Shared auth “flow layer” (NO UI)

Create a shared package (recommended: `packages/auth-flow`) to centralize cross-platform logic:

- **Normalized error model**: `AuthError = { code, message, fieldErrors?, retryAfterSeconds? }`.
- **Error mapper**: `mapTrpcErrorToAuthError(err)` that:
- maps `TRPCError` codes (`UNAUTHORIZED`, `BAD_REQUEST`, `TOO_MANY_REQUESTS`, etc.) and common messages from `apps/api/src/router/auth.ts` into safe, user-friendly copy.
- detects rate-limit (backend often returns success for non-enumerable endpoints; UI still needs resend timers).
- **Zod schemas (UI-facing)**: re-export or wrap existing schemas from `packages/validations` to avoid duplication.
- **Auth API wrapper (no renames)**: a thin wrapper that calls existing tRPC procedures using a passed-in `ApiClient` instance:
- `loginWithPassword`, `registerOrgAndUser`, `refreshAccessToken`, `logout`
- `requestOtp`, `verifyOtp`
- `requestMagicLink`, `consumeMagicLink`
- `requestEmailVerification`, `verifyEmail`
- `requestPhoneVerification`, `verifyPhone`
- `requestPasswordReset`, `resetPassword`
- `enrollMfa`, `verifyMfaEnrollment`, `generateRecoveryCodes`, `verifyMfa`, `disableMfa`
- `stepUpAuth`
- `listSessions`, `revokeSession`

**Files** (new):

- `packages/auth-flow/src/errors.ts`
- `packages/auth-flow/src/schemas.ts` (re-export)
- `packages/auth-flow/src/api.ts`
- `packages/auth-flow/src/index.ts`

## 2) Token/session handling (shared client behavior)

Implement a consistent `SessionProvider` per platform using the shared flow layer:

- **State**: `sessionStatus: loading|authenticated|unauthenticated`, `tokens`, and convenience helpers.
- **Refresh strategy**:
- implement `refresh()` via `auth.refresh`.
- add “refresh on 401” behavior in each platform’s `createTrpcClient` wrapper (or via a single request wrapper) with loop prevention.
- **Redirect rules**:
- If authenticated and user hits auth pages, redirect to shell root.
- If unauthenticated and user hits protected routes, redirect to login with `returnTo`.

**Token storage**:

- Web: keep existing localStorage now (document security caveats), but encapsulate behind `SessionProvider`.
- Desktop: keep localStorage now.
- Mobile: implement secure persistence with `expo-secure-store`.

## 3) Web + Desktop UI (shadcn)

Create a shared “auth layout” and pages for both apps.

### 3.1 Shared shadcn components

Add shadcn components (install per app) needed by the spec:

- `Card`, `Button`, `Input`, `Label`, `Tabs`, `Alert`, `Separator`, `Dialog`

### 3.2 Web routes (Next.js App Router)

Implement routes in `apps/web/src/app/`:

- `/login` (Tabs: Password / OTP / Magic Link)
- `/register`
- `/verify`
- `/forgot-password`
- `/reset-password?token=...`
- `/mfa`
- `/sessions`
- `/step-up`
- `/(auth)/magic?token=...` (or `/magic-link?token=...`) to consume magic links safely

Each page uses the shared flow layer + session provider and meets UX rules:

- loading + inline errors
- resend timers for OTP/magic link
- no logging tokens/codes

### 3.3 Desktop routes

Because desktop is currently a single-page shell, implement an **auth screen set** inside the desktop app (UI parity) using the same shadcn components:

- either as internal “routes” managed by state (MVP) or react-router (optional follow-up)
- screens matching web: login/register/verify/forgot/reset/mfa/sessions/step-up

## 4) Mobile UI (Expo RN)

### 4.1 Navigation

Implement an `AuthStack` group in Expo Router:

- `app/(auth)/login.tsx` (segmented control for password/otp/magic)
- `app/(auth)/register.tsx`
- `app/(auth)/verify.tsx`
- `app/(auth)/forgot-password.tsx`
- `app/(auth)/reset-password.tsx` (reads token from query)
- `app/(auth)/mfa.tsx`
- `app/(auth)/sessions.tsx`
- `app/(auth)/step-up.tsx`
- `app/(auth)/magic-consume.tsx` (deep link token consumer)

Route switching:

- If authenticated -> `/(shell)` (existing tabs)
- If unauthenticated -> `/(auth)`

### 4.2 RN component kit

Extend the existing grayscale RN kit under `apps/mobile/components/`:

- `Screen`, `TextField`, `AlertBanner`, `OtpInput` (6-digit)
- reuse `Button/Card/Header` already present

### 4.3 Deep links

- Configure Expo linking so:
- `serp://magic-consume?token=...`
- `serp://reset-password?token=...`
- `serp://verify-email?token=...`
- Implement token parsing and immediate procedure call, then navigate to success/failure screen.

## 5) Wire each flow end-to-end (real procedures)

For each flow, implement the concrete state machine-like UX described in `requirement_3.md`:

- Password login -> tokens -> session update -> redirect
- OTP request -> verify -> tokens
- Magic link request -> consume on dedicated route
- Email verification request + verify
- Phone verification request + verify (E.164)
- Forgot/reset password
- MFA enroll -> QR/secret display -> verify enrollment -> recovery codes display once -> verify MFA on demand -> disable MFA
- Step-up screen calls `auth.stepUp` and returns to `returnTo`
- Sessions list + revoke (confirm dialog)
- Logout calls `auth.logout` and clears session

## 6) Testing + QA safeguards

### 6.1 Unit tests (shared)

Add tests for:

- error mapper
- zod schema helpers (if any)
- refresh loop prevention logic

### 6.2 Minimal platform tests

- Web: render login tabs, ensure validation + submit disabled while loading.
- Mobile: test deep link token parsing + flow function calls (logic-level tests).

### 6.3 QA checklist doc

Create `docs/auth-qa.md` with manual smoke checklist exactly matching the spec.---

## Security guardrails (must follow)