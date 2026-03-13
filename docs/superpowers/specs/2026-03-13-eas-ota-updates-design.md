# EAS OTA Updates with Channel-Based CI

## Summary

Add over-the-air (OTA) updates to the Claude Code Remote app using EAS Update with channel-based deployment automated via EAS Workflows. Updates are checked automatically on app launch. Rollback protection is provided by Expo's built-in anti-bricking measures.

## Motivation

Currently, every JS/asset change requires a full native build and (for production) App Store/Play Store submission. OTA updates allow pushing JS-only changes instantly to users without going through the store review process.

## Design

### 1. Install `expo-updates`

Add the `expo-updates` package as a dependency.

### 2. App Configuration (`app.json`)

Add the following to the `expo` object:

```json
{
  "updates": {
    "checkAutomatically": "ON_LOAD",
    "fallbackToCacheTimeout": 5000
  },
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

- **`checkAutomatically: "ON_LOAD"`** — checks for updates every time the app starts (default behavior).
- **`fallbackToCacheTimeout: 5000`** — waits up to 5 seconds for an update to download before launching the cached version. Balances launch speed with update freshness.
- **`runtimeVersion.policy: "appVersion"`** — ties update compatibility to the app's `version` field. When a native-breaking change bumps the app version, old updates won't apply to the new binary.

### 3. EAS Configuration (`eas.json`)

Add `channel` to each build profile:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  }
}
```

### 4. EAS Workflow Files

#### `.eas/workflows/ota-update-preview.yml`

```yaml
name: OTA Update (Preview)

on:
  push:
    branches: ['preview']

jobs:
  update:
    name: Send preview update
    type: update
    params:
      channel: preview
```

#### `.eas/workflows/ota-update-production.yml`

```yaml
name: OTA Update (Production)

on:
  push:
    branches: ['main']

jobs:
  update:
    name: Send production update
    type: update
    params:
      channel: production
```

### 5. One-Time Setup (Manual)

- Link the GitHub repository to the EAS project via the Expo dashboard at the project's GitHub settings page.
- This enables the `on: push` triggers in the workflow files.

### 6. Rollback & Recovery

- **Anti-bricking measures** are enabled by default in `expo-updates`. If an update causes a crash loop, the app falls back to the embedded bundle.
- **Manual rollback** is available via `eas update:rollback --channel <channel>` to revert to the previous update on a given channel.
- No additional configuration is needed for either mechanism.

## Git Branching Workflow

```
feature-branch ──> preview branch ──> main branch
                        │                   │
                   auto OTA to          auto OTA to
                   preview builds       production builds
```

- Work on feature branches as usual.
- Merge to `preview` branch triggers automatic OTA update to all preview/internal builds.
- Merge `preview` to `main` triggers automatic OTA update to all production builds.
- Native changes (new plugins, SDK upgrades, `app.json` native config) still require `eas build` + store submission.

## Scope Boundaries

### Included
- `expo-updates` installation and configuration
- Channel-based EAS Update setup
- Two EAS Workflow YAML files for automated deployment
- Documentation of the git branching workflow

### Not Included
- In-app update UI (no "Check for updates" button)
- Update analytics beyond the Expo dashboard
- EAS Workflow for full native builds (can be added separately)
- CI/CD for anything other than OTA updates

## Affected Files

| File | Change |
|------|--------|
| `package.json` | Add `expo-updates` dependency |
| `app.json` | Add `updates` and `runtimeVersion` config |
| `eas.json` | Add `channel` to each build profile |
| `.eas/workflows/ota-update-preview.yml` | New file — preview update workflow |
| `.eas/workflows/ota-update-production.yml` | New file — production update workflow |
