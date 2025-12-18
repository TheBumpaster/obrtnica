---
name: Remove Mobile App
overview: Hard-remove `apps/mobile` from the monorepo to eliminate Expo/React Native peer dependency conflicts, while preserving a small read-only archive under `docs/` for future reference.
todos:
  - id: prereq-scope-approval
    content: Get explicit authorization to do this as repo maintenance without a backlog item, or create a backlog item for it.
    status: completed
  - id: archive-mobile
    content: Create `docs/archive/mobile/` and copy a minimal set of reference files; add an archive README documenting removal rationale.
    status: completed
    dependencies:
      - prereq-scope-approval
  - id: delete-mobile-app
    content: Remove `apps/mobile/` from the repo (tracked files).
    status: completed
    dependencies:
      - archive-mobile
  - id: prune-root-scripts
    content: Remove `mobile:*` scripts from root `package.json`.
    status: completed
    dependencies:
      - delete-mobile-app
  - id: update-ci-scripts
    content: Remove mobile version stamping from `scripts/ci/stamp-versions.ts`.
    status: completed
    dependencies:
      - delete-mobile-app
  - id: update-docs
    content: Update README and release/pipeline docs to remove mobile as an active platform; keep archive note.
    status: completed
    dependencies:
      - delete-mobile-app
  - id: regenerate-lockfile
    content: Regenerate `pnpm-lock.yaml` via a clean install so mobile deps are gone.
    status: completed
    dependencies:
      - delete-mobile-app
  - id: verify
    content: Run `pnpm verify` and ensure green.
    status: completed
    dependencies:
      - regenerate-lockfile
      - prune-root-scripts
      - update-ci-scripts
      - update-docs
---

# Plan: Hard-remove `apps/mobile` from the monorepo

## Goals

- Remove the mobile application package (`@serp/mobile`) so it no longer participates in installs, Turbo runs, CI/release tooling, or docs.
- Preserve a small **read-only** reference archive (non-buildable) under `docs/`.
- Keep diffs minimal and ensure `pnpm verify` remains green.

## Preconditions (process / repo rules)

- This change is not currently represented as a versioned backlog item. To stay compliant with “backlog is source of truth”, do one of:
- Add a backlog item for “Remove mobile app from monorepo”, then we implement it, or
- Explicitly confirm you’re authorizing this as an operational repo-maintenance change without a backlog item.

## Inventory (what currently references mobile)

- Root scripts reference mobile:
- `mobile:dev`, `mobile:build` in [`package.json`](package.json).
- CI helper script stamps mobile version:
- `apps/mobile/app.json` in [`scripts/ci/stamp-versions.ts`](scripts/ci/stamp-versions.ts).
- Documentation references mobile as a first-class platform:
- [`README.md`](README.md)
- [`docs/infrastructure/releases.md`](docs/infrastructure/releases.md)
- [`docs/implementation-summaries/ci-cd-release-pipeline.md`](docs/implementation-summaries/ci-cd-release-pipeline.md)
- [`docs/project-review-report.md`](docs/project-review-report.md)
- [`docs/implementation-summary.md`](docs/implementation-summary.md)
- Backlog mentions exist (e.g. `backlog/v1.0.0/project_setup/requirement_1.md`), but per repo rules we will **not** edit backlog files unless you explicitly request it.

## Implementation Steps

### 1) Create a read-only archive under docs (minimal + non-buildable)

- Create `docs/archive/mobile/` with:
- `docs/archive/mobile/README.md` explaining:
    - why mobile was removed (peer dependency/version mismatch impact)
    - what was archived
    - last known package name/version and key deps (from `apps/mobile/package.json`)
- Copy only key reference files (no `node_modules/`, no build outputs):
    - `apps/mobile/app.json`
    - `apps/mobile/package.json`
    - `apps/mobile/tsconfig.json`
    - `apps/mobile/.eslintrc.js`
    - `apps/mobile/fastlane/*` (since release docs mention it)
    - Optionally a small snapshot of routing entrypoints (for reference only): `apps/mobile/app/_layout.tsx` and `apps/mobile/app/(shell)/_layout.tsx`

### 2) Remove the mobile workspace package

- Delete `apps/mobile/` from the repo (using git removal so tracked files are removed cleanly).
- Ensure no other repo areas import `@serp/mobile` (current search shows only `apps/mobile/package.json` and root scripts, but we’ll re-check after deletion).

### 3) Prune monorepo scripts that target mobile

- Update [`package.json`](package.json):
- Remove `mobile:dev` and `mobile:build` scripts.
- (Optional) If you want a clearer UX: add a script alias like `mobile:dev` that prints a helpful message and exits 1; but default recommendation is to **remove** them to avoid false expectations.

### 4) Remove mobile from CI/release helper scripts

- Update [`scripts/ci/stamp-versions.ts`](scripts/ci/stamp-versions.ts):
- Remove the “Update mobile app.json” block and adjust comments so the script only writes `scripts/ci/build-metadata.json`.

### 5) Update docs so they match the new reality (web + desktop + api + worker)

- Update [`README.md`](README.md):
- Remove mobile from “3 client apps” list and project structure.
- Remove mobile from “Release Builds” section.
- Update [`docs/infrastructure/releases.md`](docs/infrastructure/releases.md):
- Remove mobile sections:
    - Version stamping bullet for mobile
    - Mobile distribution notes
    - Any mobile build matrix references
- Update [`docs/implementation-summaries/ci-cd-release-pipeline.md`](docs/implementation-summaries/ci-cd-release-pipeline.md):
- Mark the previous mobile build system section as historical context and note mobile has been removed.
- Remove artifact examples for `serp-mobile_*`.
- Update other docs that mention `apps/mobile` as active:
- [`docs/project-review-report.md`](docs/project-review-report.md)
- [`docs/implementation-summary.md`](docs/implementation-summary.md)

### 6) Dependency graph hygiene after deletion

- Regenerate workspace state so installs no longer consider mobile:
- Remove lockfile references by running a fresh install (this will rewrite `pnpm-lock.yaml`).
- If `apps/mobile/node_modules` was accidentally committed (it appears in your working tree), ensure it is not tracked and is removed.

### 7) Verification (required)

- Run the repo’s canonical gate:
- `pnpm verify`
- If CI workflows exist in your real repo (docs reference `.github/workflows/release-artifacts.yml` but it is not present in this workspace snapshot), also remove/adjust any jobs that build mobile artifacts.

## Expected Outcome

- `pnpm install` no longer has Expo/React Native peer-dependency conflicts.
- `turbo run dev/build/lint/typecheck/test` no longer touches mobile.
- Release/version stamping no longer tries to update `apps/mobile/app.json`.
- Docs accurately describe a 2-client setup: web + desktop (mobile archived/removed).

## Notes / Non-goals

- We will not modify versioned backlog files unless you explicitly ask.