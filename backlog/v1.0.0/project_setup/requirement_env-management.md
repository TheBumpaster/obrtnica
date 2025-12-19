# Environment Variables Management

## Requirement

Implement a centralized environment variable management system that allows all apps (`apps/api`, `apps/worker`, `apps/client`) to share a single root `.env` file with support for multi-environment layering.

## Scope

### 1. Root-Based Env File Strategy

- All environment variables must be defined at the repository root (`.env` files)
- No per-app `.env` files should be required
- All apps must consume the same root env files

### 2. Multi-Environment Layering

Support the following env file precedence (later files override earlier ones):

1. `.env` (base configuration, committed if non-sensitive)
2. `.env.local` (local overrides, gitignored)
3. `.env.<NODE_ENV>` (e.g., `.env.development`, `.env.production`, `.env.test`)
4. `.env.<NODE_ENV>.local` (e.g., `.env.development.local`, gitignored)

**Precedence rule**: Later files override earlier files when the same variable is defined.

### 3. App Loading Mechanism

- **API and Worker**: Use shared env loader script that loads root env files before app startup
- **Client (Next.js)**: Use NODE_OPTIONS preload approach (no `next.config.ts` changes) to load root env files
- All apps must execute via the shared env runner in their package.json scripts

### 4. Centralized Env Access

- Move all scattered `process.env` reads into centralized config modules:
  - `apps/api/src/config.ts` must include all API env vars
  - `apps/worker/src/config.ts` must include all worker env vars
- Remove hardcoded fallback secrets from request-path code
- All env access must go through config modules for auditability

### 5. Documentation Requirements

- Create `docs/environment-variables.md` listing:
  - All env vars used in the project
  - Required/optional status
  - Default values
  - Which app(s) use each variable
  - File locations where variables are used
  - Data classification (per `docs/data-classification.md`)
  - Security notes (rotation, logging restrictions)
- Update `docs/infrastructure/runbook.md` to reflect new env setup process
- Create `/.env.example` with all variables documented

## Definition of Done

- [ ] Backlog requirement file created (this file)
- [ ] Shared env loader script implemented at `scripts/env/`
- [ ] All app package.json scripts updated to use shared loader
- [ ] All `process.env` reads moved to config modules
- [ ] `.env.example` created at root with all variables
- [ ] `docs/environment-variables.md` created with complete inventory
- [ ] `docs/infrastructure/runbook.md` updated with env setup instructions
- [ ] `pnpm verify` passes
- [ ] All apps (`api:dev`, `worker:dev`, `client:dev`) start successfully with only root env files

## Security Considerations

- Secrets (JWT_SECRET, MFA_ENCRYPTION_KEY, provider API keys) must be classified as RESTRICTED + AUTH/INTEGRATIONS
- No secrets should have hardcoded fallbacks in production code paths
- `.env.local` and `.env.*.local` files must remain gitignored
- `.env.example` must not contain real secrets, only placeholders
