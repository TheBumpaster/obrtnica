---
alwaysApply: true
---

- Notifications must go through a single domain-level interface (service) in `packages/core`.
- In-app notifications are authoritative user-facing records and must be stored in Postgres.
- Push (FCM/APNs), Email (Mailjet), SMS (Twilio) delivery must be async via worker/queue.
- Always respect user notification preferences (per channel, per tenant/org).
- Handle invalid device tokens and provider failures gracefully (retry + DLQ; do not crash workers).
