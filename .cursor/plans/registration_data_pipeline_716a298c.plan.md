---
name: Registration Data Pipeline
overview: Align registration UI data with backend schema and tRPC procedures, adding needed DB fields and validation, and wiring a two-step registration flow.
todos:
  - id: audit-schema
    content: Review user/org schema for missing registration fields
    status: completed
  - id: migrate-schema
    content: Add migration for user+company fields (names, phone, address, ids, pdv optional)
    status: completed
  - id: validations-contracts
    content: Update Zod schemas/contracts for registration payload with rules
    status: completed
  - id: trpc-register
    content: Update/create tRPC register procedure to accept combined payload and transact user+org creation
    status: completed
  - id: tests-register
    content: Add tests for validation and tRPC procedure (success/duplicate/invalid)
    status: completed
---

# Align Registration Data with Backend

## Goals

- Persist all fields captured in the new 2-step registration UI (user + company) in the database.
- Update tRPC procedures/validation to accept and store these fields transactionally.
- Keep existing auth/session flows intact; add any missing migrations.

## Proposed Scope

- **User fields (Step 1):** first name, last name, phone, email, password, (password confirm client-side), password policy (>=8 chars, upper, number).
- **Company fields (Step 2):** responsible person name/surname, company name, company type, address/street, city, postal code, registration number (matični), ID broj (13 digits), PDV broj (12 digits, optional).

## Touchpoints

- DB schema/migrations: `packages/db/src/schema/*` (users, organizations/companies, addresses if separate).
- API/tRPC: `apps/api/src/router/auth.ts` (or register handler), shared contracts `packages/trpc/src`, validations `packages/validations/src/auth.ts` (or new files).
- Service logic: `packages/core` (auth/registration services) if present.

## Plan

- **Schema audit**: Check existing user/org tables for fields; identify missing columns (e.g., phone, first_name/last_name, company type, address, city, postal_code, registration_id, id_broj, pdv_broj). Decide on table(s): extend `users` for person fields; extend `organizations` (or `companies`) for company fields; add address fields inline or link to address table.
- **Migration**: Create a Drizzle migration adding missing columns with appropriate types/constraints (nullable where optional, unique for email, optional PDV).
- **Validation/contracts**: Update shared Zod schemas in `packages/validations` for registration input (step1+step2 payload). Add length checks (password ≥8 with upper+number, ID=13 digits, PDV=12 digits optional).
- **tRPC procedure**: Update/create register mutation (e.g., `auth.register` or new `auth.registerWithOrg`) to accept combined payload from both steps, run server-side validation, and perform a transaction to create org + user, hash password, and link membership. Return session or verification requirements per existing flow.
- **Service logic**: If core service exists, wire the procedure to it; otherwise implement in API router with proper error handling (uniqueness on email/org).
- **Client wiring (optional later)**: Adjust the two-step UI to POST combined payload; for now ensure backend endpoint exists and documented.
- **Testing**: Add unit/integration test for registration tRPC procedure (success, duplicate email, invalid lengths), migration sanity (Drizzle snapshot), and validation tests.

## Todos

- audit-schema: Review user/org schema for missing registration fields.
- migrate-schema: Add migration to store user+company fields (names, phone, address, ids, pdv optional).
- validations-contracts: Update Zod schemas/contracts for registration payload with rules.
- trpc-register: Update/create tRPC register procedure to accept combined payload and transact user+org creation.