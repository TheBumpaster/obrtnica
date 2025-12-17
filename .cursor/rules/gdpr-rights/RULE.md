---
alwaysApply: true
---

All GDPR data-subject rights features must follow the defined workflows.

## 1) Required Workflows
Implement GDPR requests as:
- API request creates a job record (privacy request)
- Worker processes asynchronously (RabbitMQ)
- Completion/failure updates job status
- Audit events record requested + completed/failed

## 2) Access Control
- Users can only export/erase their own data unless explicit admin authorization exists.
- Admin on-behalf actions must be audited with actor and target clearly separated.

## 3) Data Minimization
- Exports must not include secrets (password hashes, tokens, OTPs).
- Prefer IDs and references; avoid exporting other users' personal data.
- Erasure must delete sessions/device tokens and anonymize identifiers where deletion is not allowed.

## 4) Derived Systems
- Mongo projections must be updated via worker (delete/rebuild) after erasure/anonymization.
- If derived systems are down, core flow must still complete and be auditable.

## 5) Documentation
Any change affecting exports/erasures must update `docs/gdpr.md` and include:
- what data is included/excluded
- retention and expiry behavior for exports
