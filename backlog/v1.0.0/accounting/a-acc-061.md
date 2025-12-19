## A-ACC-061 — Generate Periodic Recognition Entries

> As the system, I want to automatically generate recognition entries per period.

### Scope
Automatically generate journal entries for deferred schedules on each applicable period.

### Dependencies
- **Deferred items**: `A-ACC-060`
- **Worker/event-driven**: `.cursor/rules/worker-event-driven/RULE.md`, `.cursor/rules/messaging-rabbitmq/RULE.md`
- **Immutability/period control**: `A-ACC-R-001`, `A-ACC-032`
- **Audit/source**: `A-ACC-R-002`

### Implementation Outline (plan)
- Implement a worker scheduler/consumer that:
  - identifies deferred items due for recognition in an open period
  - generates balanced journal entries
  - is idempotent (safe to retry / re-run)
- Emit audit events for success/failure of generation runs.

### Acceptance Criteria
- For each open period, system generates recognition entries per schedule.
- Generated entries are:
  - balanced
  - immutable once posted
  - linked to the deferred item and source reference
- Generation is idempotent (no double-posting if the job retries).
- If a period is closed, generation for that period is skipped/rejected with auditable outcome per policy.

### Definition of Done (DoD)
- Event/job behavior conforms to repo rules (versioned messages, correlation ids where available, bounded retries + DLQ).
- Failure modes documented (queue down, worker down, partial processing).
