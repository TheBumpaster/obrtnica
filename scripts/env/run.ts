#!/usr/bin/env tsx
/**
 * Command runner that loads root env files before executing a command
 * Usage: tsx scripts/env/run.ts -- <command> [args...]
 */

import { spawn } from 'child_process';
import { loadEnvFiles } from './load';

// Find the -- separator
const dashDashIndex = process.argv.indexOf('--');
if (dashDashIndex === -1 || dashDashIndex === process.argv.length - 1) {
  console.error('Usage: tsx scripts/env/run.ts -- <command> [args...]');
  process.exit(1);
}

// Load env files before executing command
loadEnvFiles();

// Extract command and args
const command = process.argv[dashDashIndex + 1];
const args = process.argv.slice(dashDashIndex + 2);

// Execute command with loaded env vars
const child = spawn(command, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

child.on('error', (error) => {
  console.error(`Failed to start command: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
