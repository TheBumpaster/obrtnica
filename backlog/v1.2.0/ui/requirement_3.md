## Implement Auth Screens + OTP/Magic Link + Verification + MFA (Web + Desktop + Mobile)

### Context (non-negotiable)

We have **three apps**:

* **Web app** (primary)
* **Desktop app** (web shell/wrapper; same UI as web)
* **Mobile app** (Expo React Native; same auth functionality, different components)

Rules:

1. **Feature parity**: Web + Desktop + Mobile must support the same auth flows (no missing pages).
2. **UI system**:

   * Web/Desktop: **shadcn/ui** components only (check registry before building custom).
   * Mobile: React Native primitives/components but styled to match the same branding.
3. **Branding / theme**: strict **black/white inverted** light/dark theme (grayscale only).
4. **Do not rewrite backend/auth core**. We must **reuse the existing tRPC procedures** and adapt UI around them.
5. Cursor must implement safely: no storing OTP codes locally, no logging secrets, no exposing tokens in URL logs.

---

# Goal

Implement the full **Authentication UI + flow wiring** for:

### Pages / Screens (all platforms)

* Login
* Register
* Verify (Email + Phone verification UI)
* Forgot password
* Reset password (token-based)
* OTP login (request code + verify)
* Magic link login (request link + consume)
* MFA enrollment + verification (TOTP + recovery codes)
* Step-up authentication flow for sensitive actions (UI gate)
* Sessions page: list sessions + revoke session
* Logout button action + refresh token integration (if app uses access token refresh)

### Existing tRPC procedures to wire (must be used as-is)

* Verify phone number with code
* Request phone verification (send SMS with code)
* Verify OTP code
* Request OTP code
* Consume magic link
* Request magic link (passwordless login)
* Reset password with token
* Request password reset
* Disable MFA
* Step-up authentication (re-authenticate for sensitive actions)
* Verify MFA (TOTP or recovery code)
* Generate recovery codes
* Verify MFA enrollment
* Enroll MFA (TOTP)
* Revoke a session
* List user sessions
* Verify email
* Request email verification
* Logout
* Refresh access token
* Login with email and password
* Register a new user and organization

---

# Deliverables

1. **Routes/screens** implemented in each app.
2. **Shared auth UI logic** (hooks + state machine-like flow) reused across platforms.
3. **Consistent theme** across platforms (black/white inversion).
4. **Robust UX**: loading, errors, retries, rate-limit messaging, code resend timers, deep link handling.

---

# Implementation Steps (do in this order)

## 1) Create shared auth “flow layer” (NO UI)

Create a shared package/module (or place in existing shared folder) that contains:

* Types + small helpers
* Input validation schemas (zod)
* Normalized error mapping
* Flow controllers/hooks that call tRPC

### 1.1 Auth flow primitives

Implement a small shared layer with:

* `AuthError` normalized shape: `{ code, message, fieldErrors?, retryAfterSeconds? }`
* `mapTrpcErrorToAuthError(err)` that:

  * Detects rate limit / invalid code / expired token / invalid password / user not found / already verified
  * Returns user-friendly copy WITHOUT leaking sensitive details

### 1.2 Shared zod schemas

* `emailSchema`, `passwordSchema`, `phoneSchema` (E.164 or your expected format), `otpSchema` (length + digits)
* `orgNameSchema` for registration

### 1.3 Shared “Auth API wrapper”

Create functions that directly call the existing tRPC mutations/queries (do not rename procedures, just wrap):

* `loginWithPassword(email, password)`
* `registerOrgAndUser(payload)`
* `requestOtp(identifier)` (email or phone depending on your backend)
* `verifyOtp(identifier, code)`
* `requestMagicLink(email)`
* `consumeMagicLink(token)` (token from URL/deep link)
* `requestEmailVerification()`
* `verifyEmail(codeOrToken)`
* `requestPhoneVerification(phone)`
* `verifyPhone(phone, code)`
* `requestPasswordReset(email)`
* `resetPassword(token, newPassword)`
* `enrollMfa()`
* `verifyMfaEnrollment(code)`
* `verifyMfa(codeOrRecovery)`
* `generateRecoveryCodes()`
* `disableMfa()`
* `stepUpAuth(challengeInput)` (password/otp/mfa depending on backend contract)
* `listSessions()`
* `revokeSession(sessionId)`
* `logout()`
* `refreshAccessToken()` (if used client-side)

**Important:** If some procedure is query vs mutation, respect that. Don’t convert shapes.

Definition of done:

* UI can consume these wrappers without caring about tRPC details.

---

## 2) Implement token/session handling (shared client behavior)

We need consistent behavior across platforms.

### 2.1 Session state

Implement `useSession()` and `SessionProvider` (or reuse existing if present):

* `sessionStatus: "loading" | "authenticated" | "unauthenticated"`
* `user`, `org`, `permissions` (if available)
* `refresh()` and `logout()`

### 2.2 Refresh token behavior

If your app uses access tokens that expire:

* Implement a client-side “refresh on 401” strategy (or reuse existing).
* Ensure `refreshAccessToken` is used only when necessary.
* Never infinite-loop refresh.

### 2.3 Redirect rules

* If authenticated → going to `/login` redirects to app shell root.
* If unauthenticated → attempting protected routes redirects to `/login` with `returnTo`.

Mobile equivalent:

* If unauthenticated → show AuthStack; if authenticated → AppStack.

Definition of done:

* Auth pages reliably redirect and don’t flicker.

---

## 3) Web + Desktop UI (shadcn) — pages and layouts

Implement **one auth layout** used by all auth pages:

* centered card, minimal, black/white
* consistent spacing and typography
* dark/light inverted
* use shadcn `Card`, `Button`, `Input`, `Label`, `Tabs`, `Alert`, `Separator`

### 3.1 Routes (web + desktop)

Implement these routes:

* `/login`

  * Tabs: “Password”, “OTP”, “Magic Link”
  * Password: email + password
  * OTP: identifier (email/phone) → request code → verify code
  * Magic link: email → request link → confirmation state
* `/register`

  * org name + email + password (+ phone optional if supported)
  * after register: show “verify your email” CTA and optionally phone verification
* `/verify`

  * two sections: Email verification + Phone verification
  * allow requesting resend
* `/forgot-password`

  * email → request password reset
* `/reset-password?token=...`

  * new password + confirm → reset with token
* `/mfa`

  * enroll, verify enrollment, show recovery codes, disable MFA
* `/sessions`

  * list sessions + revoke
* `/step-up`

  * used when sensitive action requires step-up; show challenge UI and returnTo after success

### 3.2 UI state requirements (web/desktop)

Every form must:

* Disable submit while loading
* Show inline field errors + top alert for general errors
* For OTP flows:

  * 6-digit input component (can be multiple inputs or one input)
  * “Resend code” button with timer (e.g. 30s)
  * “Change identifier” link (returns to request state)
* For Magic link:

  * Show “check your inbox”
  * Provide “resend link” with timer
* For Verify pages:

  * Email verification: input for code/token if you use code entry OR “verify via link” explanation if link-only
  * Phone verification: phone + code entry
* For MFA:

  * Enroll → show QR + secret (only if your API returns it)
  * Verify enrollment (TOTP)
  * Generate + display recovery codes once (warn user to save)
  * Verify MFA prompt: accept either TOTP or recovery code
* For Sessions:

  * table with device/user-agent (if available), createdAt, lastActiveAt, current indicator
  * revoke requires confirmation dialog

Definition of done:

* All pages render and are usable on web and desktop.

---

## 4) Mobile UI (Expo RN) — screens and navigation

Mobile must have the same flows but using RN components.

### 4.1 Navigation

Implement `AuthStack` with:

* LoginScreen (tabs-like segmented control)
* RegisterScreen
* VerifyScreen
* ForgotPasswordScreen
* ResetPasswordScreen
* MFAScreen
* SessionsScreen
* StepUpScreen
* MagicLinkConsumeScreen (deep link handler)

### 4.2 Mobile component kit (grayscale only)

Create reusable components:

* `Screen`, `Card`, `TextField`, `PrimaryButton`, `SecondaryButton`, `AlertBanner`, `OtpInput`
  Theme tokens:
* light: bg white, text black, border gray
* dark: bg black, text white, border gray
  No accent colors.

### 4.3 Deep links

Implement deep link handling for:

* Magic link consume (token in URL)
* Email verification (token/code in URL)
* Password reset (token in URL)
  On open:
* Parse token
* Call consume/verify/reset procedure
* Navigate to appropriate screen

Definition of done:

* All auth flows are functional on mobile with consistent styling.

---

## 5) Wire up each flow end-to-end (must be real)

Implement the following exact flow behaviors using the procedures list.

### 5.1 Password login

* Submit `Login with email and password`
* On success: update session state, redirect to returnTo or app root
* If backend returns “MFA required” state:

  * route to MFA verification screen, then continue

### 5.2 Register (new user + organization)

* Submit `Register a new user and organization`
* On success:

  * consider user authenticated OR pending verification depending on backend response
  * show next step: `Request email verification`
  * optionally ask for phone verification (if required)

### 5.3 OTP login (request + verify)

* Step A: request OTP: `Request OTP code`
* Step B: verify code: `Verify OTP code`
* On success: authenticated, redirect

### 5.4 Magic link login (request + consume)

* Request: `Request magic link`
* Consume:

  * Web/Desktop: token from query param route `/auth/magic?token=...` (or your existing route)
  * Mobile: deep link screen
  * Call `Consume magic link`
* On success: authenticated, redirect

### 5.5 Email verification

* Request resend: `Request email verification`
* Verify: `Verify email` (token/code)
* After success: show success state and back to app

### 5.6 Phone verification

* Request: `Request phone verification`
* Verify: `Verify phone number with code`

### 5.7 Forgot + Reset password

* Request: `Request password reset`
* Reset: `Reset password with token`
* After reset: redirect to login and show “password updated”

### 5.8 MFA

* Enroll: `Enroll MFA (TOTP)`

  * display QR/secret if provided
* Verify enrollment: `Verify MFA enrollment`
* Generate recovery codes: `Generate recovery codes`
* Verify MFA on login: `Verify MFA (TOTP or recovery code)`
* Disable MFA: `Disable MFA` (require step-up gate if backend expects)

### 5.9 Step-up authentication

* A reusable screen/page that calls `Step-up authentication`
* After success: return to requested action (use `returnTo`)

### 5.10 Sessions

* List: `List user sessions`
* Revoke: `Revoke a session`
* Indicate current session; prevent revoking current unless allowed

### 5.11 Logout + refresh

* Logout: `Logout` then clear client session
* Refresh: `Refresh access token` integrated into session handling if applicable

Definition of done:

* Each procedure is exercised by UI, not stubbed.

---

## 6) Testing + QA safeguards (minimum required)

### 6.1 Unit tests

* zod schemas
* error mapper
* permission/session redirect logic (if exists)

### 6.2 Smoke tests per platform (manual checklist in repo)

Create a `docs/auth-qa.md` checklist:

* login/password success + invalid password
* OTP request + verify (invalid, expired, resend)
* magic link request + consume
* verify email link
* forgot/reset password
* MFA enroll + verify + recovery code + disable
* sessions list + revoke
* logout + redirect

---

# Guardrails (do not mess these up)

* Do NOT log OTP codes, tokens, secrets, recovery codes in console.
* Do NOT store tokens in insecure places; use existing secure storage approach.
* Do NOT invent new tRPC procedures.
* Do NOT make mobile “lite” — implement all flows, even if some screens are hidden behind “More”.
* All UI must be grayscale only.

---

# Output expectation

Implement:

* All routes/screens
* Shared auth hooks/wrappers
* Theme tokens & styling
* Deep link consumption
* Basic tests and QA doc

Commit in small logical commits if your workflow supports it.
