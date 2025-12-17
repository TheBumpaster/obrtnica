# Audit Logging

> **Note**: The comprehensive audit logging documentation has moved to the compliance procedures directory.

Please see [Compliance Procedures: Audit Logging](./compliance/procedures/audit-logging.md) for:
- What is logged (baseline audit events)
- Data model and schema
- Architecture and flow
- Retention policies
- Failure modes and resilience
- Compliance mapping (SOC 2, ISO 27001, HIPAA, GDPR)

---

## Quick Reference

### Audit Event Types
See [Event Taxonomy](./compliance/procedures/audit-logging.md#9-event-taxonomy-starter-list) for full list.

### Forbidden Metadata
Audit logs **never contain**:
- Passwords, tokens, secrets
- Raw payment data
- Full request payloads
- PHI content

See [Forbidden Metadata](./compliance/procedures/audit-logging.md#3-forbidden-metadata-critical) for details.

### Data Classification
All audit events are tagged with classification and categories from the [Data Classification Schema](./data-classification.md).
