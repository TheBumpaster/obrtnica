---
name: Requirement2-DataClassification
overview: Add the Step 1 data classification documentation and a small shared type surface in packages/core so later audit/logging work can consistently tag data sensitivity.
todos:
  - id: dc-doc
    content: Create docs/data-classification.md per requirement_2 (levels, categories, controls, examples, defaults).
    status: completed
  - id: dc-core-types
    content: Add DataClassification/DataCategory/DataTag exports to packages/core/src/types.ts and ensure they are re-exported via packages/core/src/index.ts (already exports ./types).
    status: completed
    dependencies:
      - dc-doc
  - id: dc-doc-link
    content: Add link from docs/compliance/README.md to docs/data-classification.md for discoverability.
    status: completed
    dependencies:
      - dc-doc
  - id: verify
    content: Run pnpm verify and ensure it passes.
    status: completed
    dependencies:
      - dc-core-types
      - dc-doc-link
---

# Plan: Implement Step 1 DataClassification (requirement_2)

## Scope (from backlog)

- Create **`docs/data-classification.md`** containing the four classification levels, data categories, handling requirements, repo representation guidance, and concrete examples as described in `backlog/v1.0.0/project_setup/requirement_2.md`.
- Add a lightweight, shared code-level “data tag” type in **`packages/core`**: `DataClassification`, `DataCategory`, and `DataTag`.

## Implementation steps

### Docs

- Add new doc: [`docs/data-classification.md`](docs/data-classification.md).
- Include sections mirroring the backlog:
- Classification levels: `PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED`
- Categories: `IDENTITY | AUTH | TENANT | CONTENT | FINANCIAL | HEALTH/PHI | ANALYTICS | AUDIT | INTEGRATIONS`
- Handling/controls per classification
- “Where to represent this” (docs + core type)
- Concrete examples across Postgres/Mongo/RabbitMQ/Push/Email/SMS
- Default rules
- (Small discoverability improvement, still backlog-aligned) Add a link from [`docs/compliance/README.md`](docs/compliance/README.md) to the new `docs/data-classification.md` so engineers can find it quickly when working on audit/GDPR/security items.

### Code (shared types)

- Update [`packages/core/src/types.ts`](packages/core/src/types.ts) to export:
- `DataClassification` union type (and optionally a `DataClassifications` const like existing `EventTypes` style)
- `DataCategory` union type (and optionally `DataCategories` const)
- `DataTag` interface: `{ classification: DataClassification; categories: DataCategory[] }`
- No runtime enforcement is added here; this is a shared vocabulary to be used by later audit/notification/GDPR work.

## Tests

- No new tests are required for this backlog item (adds documentation + TypeScript types only, no runtime logic).

## Verification (project scripts)

- Run `pnpm verify` (repo-defined completion gate).

## Traceability (what changes)

- **Docs**: [`docs/data-classification.md`](docs/data-classification.md) (+ link in [`docs/compliance/README.md`](docs/compliance/README.md))
- **Core types**: [`packages/core/src/types.ts`](packages/core/src/types.ts)

## Notes for Step 2 alignment (non-scope, just future-proofing)

- `requirement_3.md` (audit infrastructure) explicitly expects audit events to be **data-tagged**; adding `DataTag` now avoids redefining classification/category enums later.