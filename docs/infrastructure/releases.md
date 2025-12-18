# Release & Artifact Build Process

This document describes how to create versioned releases with build artifacts for all platforms.

## Overview

The CI/CD pipeline automatically builds and packages artifacts for all platforms when a version tag is pushed. Artifacts are attached to a GitHub Release.

**Supported Platforms:**
- **Web**: Next.js standalone server
- **Mobile**: Android (APK/AAB) + iOS (IPA)
- **Desktop**: Windows, Linux, macOS (Electron)
- **API**: Node.js service bundle
- **Worker**: Node.js service bundle

**Release Channels:**
- **Development** (`vX.Y.Z-dev`): Android, Linux, Windows only
- **Staging** (`vX.Y.Z-stage`): All platforms including iOS and macOS
- **Production** (`vX.Y.Z`): All platforms including iOS and macOS

## Tag Format (Semver)

Tags follow semantic versioning with optional channel suffix:

```
vX.Y.Z          → Production release
vX.Y.Z-stage    → Staging release (prerelease)
vX.Y.Z-dev      → Development release (prerelease)
```

**Examples:**
- `v1.0.0` → Production
- `v1.0.0-stage` → Staging
- `v1.0.0-dev` → Development

## How to Create a Release

### 1. Ensure code is ready

Before tagging:
- All changes are merged to the appropriate branch (`main` for prod, `develop` for stage/dev)
- Quality checks pass locally: `pnpm verify`
- Integration tests pass if applicable

### 2. Create and push the tag

```bash
# For production release
git tag v1.0.0
git push origin v1.0.0

# For staging release
git tag v1.0.0-stage
git push origin v1.0.0-stage

# For development release
git tag v1.0.0-dev
git push origin v1.0.0-dev
```

### 3. Monitor the workflow

- Go to **Actions** tab in GitHub
- Find the **Release Artifacts** workflow run
- Monitor progress of all build jobs

### 4. Release is published automatically

Once all builds complete:
- A GitHub Release is created at the tag
- Release notes are auto-generated from commits
- All artifacts are attached to the release
- Production releases are marked as latest
- Staging/dev releases are marked as prerelease

## Build Artifacts

Each release includes the following artifacts:

### Client Web
- `serp-client-web_X.Y.Z_<channel>_linux-x64.zip`
  - Contains: `.next/standalone`, `.next/static`, `public/`, `build-metadata.json`
  - Run: `./start.sh` or `node apps/client/server.js`

### API
- `serp-api_X.Y.Z_<channel>_linux-x64.zip`
  - Contains: `dist/`, `node_modules/`, `package.json`, `build-metadata.json`
  - Run: `./start.sh` or `node dist/index.js`

### Worker
- `serp-worker_X.Y.Z_<channel>_linux-x64.zip`
  - Contains: `dist/`, `node_modules/`, `package.json`, `build-metadata.json`
  - Run: `./start.sh` or `node dist/index.js`

### Client Electron
- `serp-client-electron_X.Y.Z_<channel>_windows-x64.zip` (all channels)
- `serp-client-electron_X.Y.Z_<channel>_linux-x64.zip` (all channels)
- `serp-client-electron_X.Y.Z_<channel>_macos-arm64.zip` (stage/prod only)
  - Contains: Electron application directory structure
  - Run: Execute the platform-specific binary

### Mobile
- `serp-mobile_X.Y.Z_<channel>_android.apk` (all channels)
- `serp-mobile_X.Y.Z_<channel>_android.aab` (stage/prod only)
- `serp-mobile_X.Y.Z_<channel>_ios.ipa` (stage/prod only)
  - Install on device or submit to stores

## Required GitHub Secrets

The release workflow requires the following secrets to be configured in the GitHub repository:

### Android Signing (required for stage/prod)
- `ANDROID_KEYSTORE_BASE64`: Base64-encoded keystore file
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password
- `ANDROID_KEY_ALIAS`: Key alias
- `ANDROID_KEY_PASSWORD`: Key password

**Setup:**
```bash
# Encode keystore for GitHub secret
base64 -i your-release.keystore | pbcopy  # macOS
base64 -w 0 your-release.keystore          # Linux
```

### iOS Signing (required for stage/prod)

**Option A: Fastlane Match (recommended)**
- `MATCH_GIT_URL`: Git repo URL for certificates/profiles
- `MATCH_PASSWORD`: Encryption password for Match
- `APPLE_ID`: Apple Developer account email
- `APPLE_TEAM_ID`: Apple Team ID
- `IOS_BUNDLE_ID`: App bundle identifier (e.g., `com.serp.mobile`)

**Option B: Manual certificates**
- Upload certificate and provisioning profile manually
- Configure in workflow (advanced)

### Optional
- `EXPO_TOKEN`: Expo account token (if Expo auth is required)

## Manual Workflow Dispatch

You can manually trigger a release build without pushing a tag:

1. Go to **Actions** → **Release Artifacts**
2. Click **Run workflow**
3. Enter the tag name (e.g., `v1.0.0-dev`)
4. Click **Run workflow**

This is useful for:
- Re-running a failed build
- Testing the release pipeline
- Building from a specific commit

## Troubleshooting

### Build fails at quality gate
- Check that Postgres/MongoDB/RabbitMQ services started correctly
- Ensure migrations pass
- Verify all tests pass locally with `pnpm verify`

### Android build fails
- Verify all Android secrets are set correctly
- Check that keystore is valid and base64-encoded properly
- Review Fastlane logs in the workflow output

### iOS build fails
- Ensure Fastlane Match is configured correctly
- Verify Apple Developer certificates are valid
- Check provisioning profiles match bundle ID
- Review CocoaPods installation logs

### Client Electron build fails on specific OS
- Check electron-builder configuration in `apps/client/package.json`
- Verify platform-specific dependencies are available
- Review electron-builder logs

### Artifacts missing from release
- Ensure all build jobs completed successfully
- Check that artifact upload steps succeeded
- Verify the release job ran after all builds

## Version Stamping

The CI pipeline automatically stamps versions into artifacts:

1. **All artifacts**: Includes `build-metadata.json` with:
   ```json
   {
     "tag": "v1.0.0",
     "version": "1.0.0",
     "channel": "prod",
     "commitSha": "abc123...",
     "builtAt": "2025-01-01T12:00:00.000Z"
   }
   ```

This metadata helps track which build is deployed where.

## Release Notes

Release notes are auto-generated from commits between tags. To improve release notes:

- Use conventional commit messages
- Reference issues/PRs in commit messages
- Keep commits atomic and descriptive

You can manually edit release notes after the release is published.

## Platform-Specific Notes

### Client Web Deployment
The client web artifact is a Next.js standalone build. Deploy by:
1. Extracting the zip
2. Setting environment variables
3. Running `start.sh` or `node apps/client/server.js`

### Client Electron Distribution
- Artifacts are unsigned by default (for internal use)
- For public distribution, configure code signing in `electron-builder` and add certificates to CI

### API/Worker Deployment
Bundles include production dependencies. Deploy by:
1. Extracting the zip
2. Setting environment variables (DATABASE_URL, etc.)
3. Running `start.sh` or `node dist/index.js`

**Important**: API/Worker require runtime services (Postgres, MongoDB, RabbitMQ) to be available.

## Future Enhancements

Out of scope for MVP (documented for future reference):
- Automatic deployments to infrastructure
- Artifact signing and notarization (client Electron/mobile)
- App Store / Play Store automatic submission
- Changelog generation from conventional commits
- Release candidate workflow
