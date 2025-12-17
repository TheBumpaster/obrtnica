#!/usr/bin/env tsx
/**
 * CI helper: Parse Git tag to derive release metadata
 * Outputs: version_core, release_channel for GitHub Actions
 */

const tag = process.env.GITHUB_REF_NAME || process.argv[2];

if (!tag) {
  console.error('Error: No tag provided. Set GITHUB_REF_NAME or pass as argument.');
  process.exit(1);
}

// Parse tag format: vX.Y.Z[-dev|-stage]
const tagPattern = /^v(\d+\.\d+\.\d+)(?:-(dev|stage))?$/;
const match = tag.match(tagPattern);

if (!match) {
  console.error(`Error: Invalid tag format "${tag}". Expected: vX.Y.Z, vX.Y.Z-dev, or vX.Y.Z-stage`);
  process.exit(1);
}

const versionCore = match[1]; // X.Y.Z
const suffix = match[2]; // 'dev' | 'stage' | undefined

let releaseChannel: 'dev' | 'stage' | 'prod';
if (suffix === 'dev') {
  releaseChannel = 'dev';
} else if (suffix === 'stage') {
  releaseChannel = 'stage';
} else {
  releaseChannel = 'prod';
}

const isPrerelease = releaseChannel !== 'prod';

// Output for GitHub Actions
if (process.env.GITHUB_OUTPUT) {
  const fs = require('fs');
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `version_core=${versionCore}\n` +
    `release_channel=${releaseChannel}\n` +
    `is_prerelease=${isPrerelease}\n` +
    `tag=${tag}\n`
  );
}

// Also output to console for debugging
console.log(JSON.stringify({
  tag,
  version_core: versionCore,
  release_channel: releaseChannel,
  is_prerelease: isPrerelease,
}, null, 2));
