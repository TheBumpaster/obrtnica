---
alwaysApply: true
---

Any change that impacts security, privacy, or compliance must include an explicit review gate.

## 1) Changes that trigger this gate
- Auth flows, sessions, MFA, password reset
- Multi-tenancy / RBAC / permissions
- Audit logging
- GDPR workflows (export/erase)
- Notifications delivery (push/email/sms)
- Storage of CONFIDENTIAL/RESTRICTED data
- Any integration with third-party providers

## 2) Required Output (in PR/task summary)
When this gate triggers, Cursor must include:
- Data classification + categories touched
- Audit events added/updated
- Failure modes (what happens if Mongo/RabbitMQ/providers are down)
- How to test (commands)
- Any changes to retention, export, or deletion behavior

If this section is missing, the task is NOT DONE.
