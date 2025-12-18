# Mobile App Archive

**Status:** Removed from monorepo  
**Date Removed:** January 2025  
**Reason:** Peer dependency version mismatches with Expo/React Native causing development friction

## What Was Archived

This directory contains a minimal reference snapshot of the mobile application (`@serp/mobile`) that was removed from the monorepo. These files are **read-only** and **non-buildable**—they exist solely for historical reference.

## Package Information

- **Package Name:** `@serp/mobile`
- **Version:** 1.0.0
- **Framework:** Expo (React Native)
- **Router:** expo-router v4.0.14
- **Expo SDK:** ~52.0.23
- **React Native:** 0.76.6

## Key Dependencies (at time of removal)

### Runtime
- `expo`: ~52.0.23
- `expo-router`: ~4.0.14
- `react`: 18.3.1
- `react-native`: 0.76.6
- `@trpc/client`: ^11.0.0

### Workspace Packages
- `@serp/api`
- `@serp/auth-flow`
- `@serp/shell-core`
- `@serp/trpc`
- `@serp/validations`

## Archived Files

- `package.json` - Package manifest and dependencies
- `app.json` - Expo configuration
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.js` - ESLint configuration
- `app/_layout.tsx` - Root layout component
- `app/(shell)/_layout.tsx` - Shell tab navigation layout
- `fastlane/` - CI/CD build configuration (Android APK/AAB, iOS IPA)

## Notes

- The mobile app used Expo Router for file-based routing
- It integrated with the shared tRPC API client
- Build system used Fastlane for Android/iOS artifact generation
- The app followed a feature-oriented structure similar to the web/desktop apps

## Future Considerations

If mobile support is needed again:
1. Consider a separate repository to avoid peer dependency conflicts
2. Use a compatible Expo SDK version that aligns with monorepo React/TypeScript versions
3. Evaluate whether Expo Go or bare workflow is more appropriate
4. Review shared package dependencies for mobile compatibility
