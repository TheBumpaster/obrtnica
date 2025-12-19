---
name: Auth Pages Alignment
overview: Restyle verify, step-up, reset-password, and MFA pages to match the login layout, and remove the sessions page from the auth root layout.
todos:
  - id: layout-verify
    content: Restyle verify page with login layout pattern
    status: completed
  - id: layout-stepup
    content: Restyle step-up page with login layout pattern
    status: completed
  - id: layout-reset
    content: Restyle reset-password page with login layout pattern and policy hint
    status: completed
  - id: layout-mfa
    content: Restyle MFA page with login layout pattern
    status: completed
  - id: remove-sessions-link
    content: Remove sessions page from root layout/sidebar
    status: completed
---

# Align Remaining Auth Pages to Login Layout

## Goals

- Make the following pages visually consistent with the new login layout (dark two-column with hero image + form):
- Verify (email code/link)
- Step-up (secondary auth step)
- Reset password
- MFA (enrollment/verification)
- Remove the sessions page from the auth root layout.

## Implementation Plan

- **Layout reuse**: Extract/reuse the hero + form container pattern (same background, spacing, typography, buttons/inputs) across the four pages.
- **Page-specific forms**:
- Verify: code input (or token), submit, and helper text.
- Step-up: password or MFA code input as needed; keep existing logic intact.
- Reset password: new password + confirm, policy hints; token handling stays.
- MFA: code entry and enrollment UI (keep functional wiring, update visuals only).
- **Cleanup**: Remove the sessions page from the root layout routing/links.

## Files to touch (likely)

- `apps/client/src/app/verify/page.tsx`
- `apps/client/src/app/step-up/page.tsx`
- `apps/client/src/app/reset-password/page.tsx`
- `apps/client/src/app/mfa/page.tsx`
- `apps/client/src/app/app/layout.tsx` (remove sessions page link/route from root layout sidebar if present)

## Todos

- layout-verify: Restyle verify page with login layout pattern.
- layout-stepup: Restyle step-up page with login layout pattern.
- layout-reset: Restyle reset-password page with login layout pattern and policy hint.
- layout-mfa: Restyle MFA page with login layout pattern.