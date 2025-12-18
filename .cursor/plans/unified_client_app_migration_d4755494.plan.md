---
name: Unified Client App Migration
overview: Merge desktop and web apps into a single unified client app (`apps/client`) based on Next.js, add Electron build capability using electron-builder with Next.js standalone output, update all rules and documentation to reflect the unified architecture.
todos:
  - id: rename-web-to-client
    content: Rename apps/web to apps/client and update package.json name to @serp/client
    status: completed
  - id: add-electron-main
    content: Create apps/client/electron/main.ts with Electron window management for Next.js standalone
    status: completed
    dependencies:
      - rename-web-to-client
  - id: add-electron-preload
    content: Create apps/client/electron/preload.ts with contextBridge API exposure
    status: completed
    dependencies:
      - rename-web-to-client
  - id: configure-electron-builder
    content: Add electron-builder config to apps/client/package.json with build scripts
    status: completed
    dependencies:
      - rename-web-to-client
      - add-electron-main
  - id: update-root-scripts
    content: "Update root package.json scripts: replace web/desktop commands with client commands"
    status: completed
    dependencies:
      - rename-web-to-client
  - id: remove-parity-rule
    content: Delete .cursor/rules/cross-platform-feature-parity/RULE.md
    status: completed
  - id: update-ui-policy-rule
    content: Update .cursor/rules/ui-policy/RULE.md to reference apps/client instead of apps/web and apps/desktop
    status: completed
  - id: update-shadcn-rule
    content: Update .cursor/rules/shadcn-mcp-enforcement/RULE.md to reference apps/client
    status: completed
  - id: update-ui-architecture-rule
    content: Update .cursor/rules/ui-clean-architecture/RULE.md to reference apps/client
    status: completed
  - id: update-architecture-boundaries-rule
    content: Update .cursor/rules/architecture-boundaries/RULE.md to reference apps/client
    status: completed
  - id: update-repo-structure-rule
    content: Update .cursor/rules/repo-file-structure/RULE.md to reference apps/client/**
    status: completed
  - id: update-project-commands-rule
    content: Update .cursor/rules/project-commands/RULE.md with new client commands
    status: completed
  - id: update-ci-workflow
    content: Update .github/workflows/release-artifacts.yml to build client app (web + electron)
    status: completed
    dependencies:
      - configure-electron-builder
  - id: create-decision-doc
    content: Create docs/decisions/v1.x.x-unified-client-app.md explaining the merge and Electron approach
    status: completed
  - id: update-runbook-docs
    content: Update docs/infrastructure/runbook.md with new client dev/build commands
    status: completed
  - id: update-release-docs
    content: Update docs/infrastructure/releases.md and ci-cd-release-pipeline.md with unified client info
    status: completed
  - id: update-readme
    content: Update README.md with new project structure and commands
    status: completed
  - id: delete-desktop-app
    content: Delete apps/desktop directory entirely
    status: completed
    dependencies:
      - configure-electron-builder
      - update-ci-workflow
  - id: verify-references
    content: Search and update any remaining references to @serp/web, @serp/desktop, apps/web, apps/desktop
    status: completed
    dependencies:
      - delete-desktop-app
---

# Unified Client App Migration Plan

## Overview

This plan merges `apps/web` and `apps/desktop` into a single unified `apps/client` application. The client app will be based on Next.js (using web's code as source of truth) and will support Electron builds using electron-builder with Next.js standalone output mode.

## Architecture Changes

```javascript
Before:
apps/
  ├── web/ (Next.js)
  └── desktop/ (Vite + Electron)

After:
apps/
  └── client/ (Next.js + Electron build target)
```

The unified client will:

- Use Next.js for web builds (default)
- Use electron-builder to wrap Next.js standalone output for desktop builds
- Maintain single codebase for both web and desktop targets
- Remove need for cross-platform parity enforcement (automatic parity)

## Implementation Steps

### Phase 1: Rename Web to Client

1. **Rename directory and update package.json**

- Rename `apps/web/` → `apps/client/`
- Update `apps/client/package.json`:
    - Change `name` from `@serp/web` to `@serp/client`
    - Update scripts to support both web and Electron builds
    - Add Electron dependencies (electron, electron-builder, etc.)

2. **Update Next.js configuration**

- Modify `apps/client/next.config.ts`:
    - Ensure `output: 'standalone'` is set (already present)
    - Add conditional configuration for Electron builds if needed

### Phase 2: Add Electron Build Capability

3. **Create Electron main process**

- Create `apps/client/electron/main.ts`:
    - Load Next.js standalone server in Electron window
    - Handle window lifecycle (similar to desktop app's main.ts)
    - Support dev mode (connect to Next.js dev server) and production (load standalone build)

4. **Create Electron preload script**

- Create `apps/client/electron/preload.ts`:
    - Expose Electron APIs via contextBridge (platform info, etc.)
    - Match functionality from desktop app's preload.ts

5. **Configure electron-builder**

- Add `build` section to `apps/client/package.json`:
    - Copy electron-builder config from `apps/desktop/package.json`
    - Update paths to point to Next.js standalone output
    - Update appId to `com.serp.client` (or keep `com.serp.desktop`)

6. **Add build scripts**

- Update `apps/client/package.json` scripts:
    - `dev`: Next.js dev server (web)
    - `dev:electron`: Start Next.js dev + Electron window
    - `build`: Next.js standalone build
    - `build:electron`: Build Next.js standalone + electron-builder
    - `build:web`: Alias for `build` (for clarity)

### Phase 3: Update Rules

7. **Remove cross-platform parity rule**

- Delete `.cursor/rules/cross-platform-feature-parity/RULE.md`
- Parity is now automatic with single codebase

8. **Update UI policy rule**

- Modify `.cursor/rules/ui-policy/RULE.md`:
    - Change scope from `apps/web` and `apps/desktop` to `apps/client`
    - Update references throughout

9. **Update shadcn MCP enforcement rule**

- Modify `.cursor/rules/shadcn-mcp-enforcement/RULE.md`:
    - Change `apps/web` and `apps/desktop` references to `apps/client`
    - Update component path examples

10. **Update UI clean architecture rule**

    - Modify `.cursor/rules/ui-clean-architecture/RULE.md`:
    - Change scope to `apps/client (Next.js with Electron build target)`

11. **Update architecture boundaries rule**

    - Modify `.cursor/rules/architecture-boundaries/RULE.md`:
    - Change `apps/web` and `apps/desktop` to `apps/client`
    - Update description to mention Electron build target

12. **Update repo file structure rule**

    - Modify `.cursor/rules/repo-file-structure/RULE.md`:
    - Change UI code path from `apps/web/**`, `apps/desktop/**` to `apps/client/**`

13. **Update project commands rule**

    - Modify `.cursor/rules/project-commands/RULE.md`:
    - Replace `web:dev`, `web:build`, `desktop:dev`, `desktop:build` with:
        - `client:dev` (web dev)
        - `client:dev:electron` (electron dev)
        - `client:build` (web build)
        - `client:build:electron` (electron build)

### Phase 4: Update Root Configuration

14. **Update root package.json**

    - Modify `package.json` scripts:
    - Replace `web:dev`, `web:build` with `client:dev`, `client:build`
    - Replace `desktop:dev`, `desktop:build` with `client:dev:electron`, `client:build:electron`
    - Update filter references from `@serp/web` to `@serp/client`

15. **Update turbo.json (if exists)**

    - Update any references to `@serp/web` or `@serp/desktop` to `@serp/client`

### Phase 5: Update CI/CD

16. **Update GitHub Actions workflow**

    - Modify `.github/workflows/release-artifacts.yml`:
    - Replace desktop build matrix with client electron build
    - Update web build job to client build
    - Update artifact names and paths
    - Ensure Next.js standalone build happens before electron-builder

### Phase 6: Update Documentation

17. **Create decision document**

    - Create `docs/decisions/v1.x.x-unified-client-app.md`:
    - Explain why web and desktop were merged
    - Document Electron build approach (electron-builder + Next.js standalone)
    - Note that web code is source of truth
    - Document any platform-specific considerations

18. **Update architecture documentation**

    - Modify `docs/infrastructure/runbook.md` (if exists):
    - Update dev commands
    - Update build instructions
    - Document Electron build process

19. **Update release documentation**

    - Modify `docs/infrastructure/releases.md` (if exists):
    - Update artifact naming
    - Update build process description

20. **Update CI/CD documentation**

    - Modify `docs/implementation-summaries/ci-cd-release-pipeline.md`:
    - Update references to web/desktop apps
    - Document unified client build process

21. **Update README.md**

    - Update any references to `apps/web` or `apps/desktop`
    - Update development commands
    - Update project structure diagram

### Phase 7: Cleanup

22. **Remove desktop app**

    - Delete `apps/desktop/` directory entirely
    - Remove from workspace (no code migration needed per requirements)

23. **Update .gitignore**

    - Ensure Electron build outputs are ignored:
    - `apps/client/release/`
    - `apps/client/dist-electron/`
    - `apps/client/.next/` (already ignored)

24. **Update any remaining references**

    - Search codebase for `@serp/web`, `@serp/desktop`, `apps/web`, `apps/desktop`
    - Update to `@serp/client` and `apps/client` where appropriate

## Key Files to Modify

### Create New Files

- `apps/client/electron/main.ts`
- `apps/client/electron/preload.ts`
- `docs/decisions/v1.x.x-unified-client-app.md`

### Modify Existing Files

- `apps/client/package.json` (rename + add Electron)
- `apps/client/next.config.ts` (verify standalone config)
- `.cursor/rules/ui-policy/RULE.md`
- `.cursor/rules/shadcn-mcp-enforcement/RULE.md`
- `.cursor/rules/ui-clean-architecture/RULE.md`
- `.cursor/rules/architecture-boundaries/RULE.md`
- `.cursor/rules/repo-file-structure/RULE.md`
- `.cursor/rules/project-commands/RULE.md`
- `package.json` (root scripts)
- `.github/workflows/release-artifacts.yml`
- `docs/infrastructure/runbook.md` (if exists)
- `docs/infrastructure/releases.md` (if exists)
- `docs/implementation-summaries/ci-cd-release-pipeline.md`
- `README.md`

### Delete Files

- `.cursor/rules/cross-platform-feature-parity/RULE.md`
- `apps/desktop/` (entire directory)

## Technical Considerations

### Electron Build Process

1. Build Next.js standalone: `next build` creates `.next/standalone/`
2. Electron-builder wraps standalone output:

- Main process loads Next.js server
- Window navigates to `http://localhost:<port>` (dev) or local file (prod)
- Preload script exposes Electron APIs

### Dev Mode

- Option A: Run Next.js dev server, Electron connects to `http://localhost:3000`
- Option B: Use `nextron`-like approach with integrated dev server

### Production Build

- Next.js standalone build includes Node.js server
- Electron window loads the standalone server
- Bundle includes all dependencies

## Verification Steps

1. `pnpm client:dev` starts Next.js dev server (web)
2. `pnpm client:dev:electron` starts Next.js dev + Electron window
3. `pnpm client:build` creates Next.js standalone build
4. `pnpm client:build:electron` creates Electron app bundle
5. All rules reference `apps/client` only
6. CI/CD builds both web and Electron artifacts
7. Documentation reflects unified architecture

## Risks and Mitigations

- **Risk**: Electron build complexity with Next.js standalone
- **Mitigation**: Use proven electron-builder + Next.js standalone pattern
- **Risk**: Dev experience may be slower with Electron wrapper