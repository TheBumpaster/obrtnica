#!/usr/bin/env tsx
/**
 * Environment variable loader for monorepo
 * Loads env files from repository root with multi-env layering support
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

/**
 * Find repository root by looking for pnpm-workspace.yaml
 */
function findRepoRoot(): string {
  let currentDir = process.cwd();
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const workspaceFile = path.join(currentDir, 'pnpm-workspace.yaml');
    if (fs.existsSync(workspaceFile)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // Fallback to current directory if workspace file not found
  return process.cwd();
}

/**
 * Load environment files in precedence order:
 * 1. .env (base)
 * 2. .env.local (local overrides, gitignored)
 * 3. .env.<NODE_ENV> (environment-specific)
 * 4. .env.<NODE_ENV>.local (environment-specific local overrides, gitignored)
 *
 * Later files override earlier ones (override: true for later files)
 */
export function loadEnvFiles(): void {
  const repoRoot = findRepoRoot();
  const nodeEnv = process.env.NODE_ENV || 'development';

  const envFiles = [
    path.join(repoRoot, '.env'),
    path.join(repoRoot, '.env.local'),
    path.join(repoRoot, `.env.${nodeEnv}`),
    path.join(repoRoot, `.env.${nodeEnv}.local`),
  ];

  // Load base .env first (override: false)
  const baseEnvPath = envFiles[0];
  if (fs.existsSync(baseEnvPath)) {
    config({ path: baseEnvPath, override: false });
  }

  // Load .env.local (override: true to allow local overrides)
  const localEnvPath = envFiles[1];
  if (fs.existsSync(localEnvPath)) {
    config({ path: localEnvPath, override: true });
  }

  // Load .env.<NODE_ENV> (override: true)
  const envSpecificPath = envFiles[2];
  if (fs.existsSync(envSpecificPath)) {
    config({ path: envSpecificPath, override: true });
  }

  // Load .env.<NODE_ENV>.local (override: true, highest precedence)
  const envLocalPath = envFiles[3];
  if (fs.existsSync(envLocalPath)) {
    config({ path: envLocalPath, override: true });
  }
}

// Auto-load if run directly
if (require.main === module) {
  loadEnvFiles();
}
