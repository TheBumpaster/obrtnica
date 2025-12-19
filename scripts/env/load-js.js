/**
 * JavaScript version of env loader for Next.js NODE_OPTIONS preload
 * Can be required directly without tsx
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Find repository root by looking for pnpm-workspace.yaml
 * Uses __dirname to find repo root relative to this script's location
 */
function findRepoRoot() {
  // Start from this script's directory and walk up
  let currentDir = __dirname;
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const workspaceFile = path.join(currentDir, 'pnpm-workspace.yaml');
    if (fs.existsSync(workspaceFile)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // Fallback: try process.cwd() if __dirname didn't work
  currentDir = process.cwd();
  while (currentDir !== root) {
    const workspaceFile = path.join(currentDir, 'pnpm-workspace.yaml');
    if (fs.existsSync(workspaceFile)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return process.cwd();
}

/**
 * Load environment files in precedence order
 */
function loadEnvFiles() {
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
    require('dotenv').config({ path: baseEnvPath, override: false });
  }

  // Load .env.local (override: true)
  const localEnvPath = envFiles[1];
  if (fs.existsSync(localEnvPath)) {
    require('dotenv').config({ path: localEnvPath, override: true });
  }

  // Load .env.<NODE_ENV> (override: true)
  const envSpecificPath = envFiles[2];
  if (fs.existsSync(envSpecificPath)) {
    require('dotenv').config({ path: envSpecificPath, override: true });
  }

  // Load .env.<NODE_ENV>.local (override: true, highest precedence)
  const envLocalPath = envFiles[3];
  if (fs.existsSync(envLocalPath)) {
    require('dotenv').config({ path: envLocalPath, override: true });
  }
}

// Auto-load when required
loadEnvFiles();
