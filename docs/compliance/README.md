# Compliance Documentation

This directory contains compliance-related documentation for the system.

## Available Documentation

### Procedures

- **[Audit Logging](procedures/audit-logging.md)** — Documents the audit logging system: what events are logged, where logs are stored, retention policies, and compliance mapping.

### Related Documentation

- **[Data Classification](../data-classification.md)** — Defines classification levels (PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED) and data categories used throughout the platform.
- **[GDPR Workflows](../gdpr.md)** — Documents GDPR data rights workflows: export, erasure, and rectification procedures.
- **[Audit Logging Overview](../audit-logging.md)** — Quick reference for audit logging (links to detailed procedure).

## Control Enforcement

Compliance controls are enforced via:

- **Cursor rules** (`.cursor/rules/`) — Architectural boundaries, security requirements, and data handling rules
- **Backlog process** (`backlog/vX.Y.Z/`) — Versioned requirements that drive implementation
- **CI commands** — `pnpm verify` runs lint, typecheck, tests, and build checks

## Standards Alignment

The system implements controls aligned with:

- **GDPR** — Data subject rights (export, erasure, rectification), data minimization, retention
- **SOC 2** — Audit logging, access controls, change management
- **ISO 27001** — Security controls, risk management (via Cursor rules and backlog)
