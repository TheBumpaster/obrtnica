---
alwaysApply: true
---

All features must follow the project's data classification schema.

## 1) Classification Levels
Data must be classified as one of:
- PUBLIC
- INTERNAL
- CONFIDENTIAL (default for user/org data)
- RESTRICTED (auth, security, PHI/health, secrets)

## 2) Categories
Data must also be tagged with one or more categories:
IDENTITY, AUTH, TENANT, CONTENT, FINANCIAL, HEALTH/PHI, ANALYTICS, AUDIT, INTEGRATIONS.

## 3) Required Behavior
- If unsure, classify as CONFIDENTIAL or RESTRICTED.
- Do not store secrets or tokens in logs, analytics projections, or message payloads.
- Derived stores (Mongo) must minimize personal identifiers; prefer IDs over email/name.
- Any feature that processes CONFIDENTIAL or RESTRICTED data must describe:
  - what data is processed
  - classification + categories
  - retention expectations (even if "TBD")

## 4) Documentation
For changes involving CONFIDENTIAL or RESTRICTED data, update or add:
- `docs/data-classification.md` (if new data types are introduced)
- `docs/gdpr.md` (if rights/retention impact exists)

If classification is unclear, document it in `docs/decisions/`.
