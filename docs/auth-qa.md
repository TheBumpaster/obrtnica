# Auth QA Checklist (Web only for v1.2.0)

Scope: Web auth flows (desktop skipped per parity exception). Mobile excluded (apps/mobile removed).

- Login (password): success, invalid password, rate-limit message.
- Login (OTP): request + verify; invalid/expired code; resend timer UI.
- Login (magic link): request; consume link; expired/invalid token path.
- Register: org+user; post-register prompt to verify email.
- Email verification: request resend; verify token; already-verified handling.
- Phone verification: request + verify; invalid code handling.
- Forgot/Reset password: request reset; reset with token; expired/invalid token.
- MFA: enroll -> verify enrollment -> generate recovery codes -> verify MFA at login -> disable MFA.
- Step-up auth: challenge and returnTo redirect after success.
- Sessions: list sessions; revoke another session; cannot revoke current session (if restricted).
- Logout: clears session and redirects to login.
- Refresh-on-401: triggers once, retries, then logs out on failure.
- Theming: grayscale only; light/dark toggle works.
- Security: no tokens/OTP codes/recovery codes logged; localStorage only for web tokens.
