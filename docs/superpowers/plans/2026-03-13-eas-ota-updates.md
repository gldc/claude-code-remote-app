# EAS OTA Updates Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OTA updates via EAS Update with channel-based CI deployment triggered by git pushes.

**Architecture:** Config-only change — install `expo-updates`, configure `app.json` and `eas.json`, add two EAS Workflow YAML files. No application code changes.

**Tech Stack:** expo-updates, EAS Update, EAS Workflows

**Spec:** `docs/superpowers/specs/2026-03-13-eas-ota-updates-design.md`

---

## Chunk 1: Install and Configure

### Task 1: Install expo-updates

**Files:**
- Modify: `package.json` (automated by installer)

- [ ] **Step 1: Install the package**

Run:
```bash
npx expo install expo-updates
```

Expected: `expo-updates` added to `dependencies` in `package.json` with SDK 55-compatible version.

- [ ] **Step 2: Verify installation**

Run:
```bash
grep expo-updates package.json
```

Expected: `"expo-updates": "~55.x.x"` (exact patch version may vary).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install expo-updates for OTA support"
```

Note: If using yarn, commit `yarn.lock` instead of `package-lock.json`. Commit whichever lock file exists.

---

### Task 2: Configure app.json

**Files:**
- Modify: `app.json`

- [ ] **Step 1: Add `updates` config and `runtimeVersion`**

Add these two keys to the `expo` object in `app.json` (after the `"android"` block, before the closing `}`):

```json
"updates": {
  "url": "https://u.expo.dev/2b217786-e650-43c4-bf18-a36f9ce1aa97",
  "checkAutomatically": "ON_LOAD",
  "fallbackToCacheTimeout": 5000
},
"runtimeVersion": {
  "policy": "fingerprint"
}
```

- [ ] **Step 2: Add `expo-updates` to the plugins array**

Add `"expo-updates"` as the last entry in the `plugins` array:

```json
"plugins": [
  "expo-router",
  "expo-secure-store",
  ["expo-notifications", { ... }],
  ["expo-splash-screen", { ... }],
  ["expo-build-properties", { ... }],
  "expo-updates"
]
```

- [ ] **Step 3: Verify the full app.json is valid JSON**

Run:
```bash
npx json5 app.json 2>&1 || python3 -c "import json; json.load(open('app.json'))"
```

Expected: No errors (valid JSON).

- [ ] **Step 4: Commit**

```bash
git add app.json
git commit -m "feat: configure expo-updates with fingerprint runtime version"
```

---

### Task 3: Configure eas.json

**Files:**
- Modify: `eas.json`

- [ ] **Step 1: Add `channel` to each build profile**

The only changes are adding a `"channel"` key to each profile. The result should be:

```json
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
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
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add eas.json
git commit -m "feat: add update channels to EAS build profiles"
```

---

## Chunk 2: Workflow Files

### Task 4: Create EAS Workflow files

**Files:**
- Create: `.eas/workflows/ota-update-preview.yml`
- Create: `.eas/workflows/ota-update-production.yml`

- [ ] **Step 1: Create the `.eas/workflows/` directory**

```bash
mkdir -p .eas/workflows
```

- [ ] **Step 2: Create preview workflow**

Write `.eas/workflows/ota-update-preview.yml`:

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
      message: "preview update"
```

- [ ] **Step 3: Create production workflow**

Write `.eas/workflows/ota-update-production.yml`:

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
      message: "production update"
```

- [ ] **Step 4: Commit**

```bash
git add .eas/
git commit -m "feat: add EAS workflow files for OTA updates"
```

---

## Chunk 3: Manual Setup & Verification

### Task 5: Post-implementation manual steps (not automatable)

These steps require the Expo dashboard and EAS CLI. They cannot be automated in this plan.

- [ ] **Step 1: Link GitHub repo to EAS project**

Go to: `https://expo.dev/accounts/gldcio/projects/claude-code-remote-app/github`

Follow the UI to install the GitHub app and connect the repository. This enables the `on: push` workflow triggers.

- [ ] **Step 2: Create the `preview` git branch**

```bash
git branch preview
git push origin preview
```

This branch is needed for the preview workflow trigger. It doesn't need to exist until you're ready to push your first preview OTA update.

- [ ] **Step 3: Rebuild native binaries**

Adding `expo-updates` is a native change. Run builds for the profiles you use:

```bash
eas build --profile preview --platform all
eas build --profile production --platform all
```

OTA updates will only work on builds created **after** `expo-updates` was added.

- [ ] **Step 4: Test the OTA pipeline**

1. Make a small visible JS change (e.g., add a temporary text element to the Settings screen)
2. Commit and push to `preview` branch
3. Verify the workflow runs on the Expo dashboard
4. Open the preview build — the change should appear after relaunch (within 5 seconds)
5. Revert the test change
