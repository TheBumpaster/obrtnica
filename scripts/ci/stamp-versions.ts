#!/usr/bin/env tsx
/**
 * CI helper: Stamp version metadata into apps before building
 * Creates build-metadata.json for each artifact
 */

import * as fs from 'fs';
import * as path from 'path';

const tag = process.env.TAG || process.argv[2];
const versionCore = process.env.VERSION_CORE || process.argv[3];
const releaseChannel = process.env.RELEASE_CHANNEL || process.argv[4];
const commitSha = process.env.GITHUB_SHA || process.env.COMMIT_SHA || 'local';

if (!tag || !versionCore || !releaseChannel) {
  console.error('Usage: stamp-versions.ts <tag> <version_core> <release_channel>');
  console.error('  or set TAG, VERSION_CORE, RELEASE_CHANNEL env vars');
  process.exit(1);
}

const builtAt = new Date().toISOString();

// Build metadata to embed in all artifacts
const buildMetadata = {
  tag,
  version: versionCore,
  channel: releaseChannel,
  commitSha,
  builtAt,
};

console.log('Stamping versions:', buildMetadata);

// Write build metadata to scripts/ci/build-metadata.json (will be copied into artifacts)
const metadataOutputPath = path.join(process.cwd(), 'scripts/ci/build-metadata.json');
fs.writeFileSync(metadataOutputPath, JSON.stringify(buildMetadata, null, 2) + '\n');
console.log(`✓ Created ${metadataOutputPath}`);

console.log('Version stamping complete.');
