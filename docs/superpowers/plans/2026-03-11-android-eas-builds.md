# Android EAS Build Support — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Android development and preview builds via EAS by updating cross-platform icons, configuring adaptive icons and cleartext traffic, and running EAS builds.

**Architecture:** Update `SymbolView` name props from iOS-only strings to `{ ios, android }` objects for Material Symbol support. Add Android adaptive icon and cleartext HTTP config to `app.json`. Update `eas.json` preview profile for APK output.

**Tech Stack:** Expo SDK 55, expo-symbols ~55.0.5 (Material Symbols on Android), EAS Build

**Spec:** `docs/superpowers/specs/2026-03-11-android-eas-builds-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/SearchBar.tsx` | Modify lines 33, 46 | Update 2 SymbolView name props |
| `components/ModelPicker.tsx` | Modify lines 45, 47 | Update 2 SymbolView name props |
| `components/AvatarRow.tsx` | Modify line 60 | Update 1 SymbolView name prop |
| `components/ExpandableCard.tsx` | Modify lines 7-9, 36, 40 | Broaden icon prop type, update 2 SymbolView usages |
| `components/BashOutputCard.tsx` | Modify line 21 | Update icon prop to object |
| `components/GitPanel.tsx` | Modify line 37 | Update icon prop to object |
| `components/ToolResultCard.tsx` | Modify line 49 | Update icon variable to object |
| `app.json` | Modify lines 54-56 | Add adaptiveIcon + usesCleartextTraffic |
| `eas.json` | Modify lines 11-13 | Add android.buildType to preview profile |

---

## Chunk 1: Cross-Platform Icons

### Task 1: Update SearchBar SymbolView names

**Files:**
- Modify: `components/SearchBar.tsx:33,46`

- [ ] **Step 1: Update the search icon to cross-platform format**

In `components/SearchBar.tsx`, change line 33 from:
```tsx
<SymbolView name="magnifyingglass" size={16} tintColor={colors.textMuted} />
```
to:
```tsx
<SymbolView name={{ ios: 'magnifyingglass', android: 'search' }} size={16} tintColor={colors.textMuted} />
```

- [ ] **Step 2: Update the clear icon to cross-platform format**

In `components/SearchBar.tsx`, change line 46 from:
```tsx
<SymbolView name="xmark.circle.fill" size={18} tintColor={colors.textMuted} />
```
to:
```tsx
<SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel' }} size={18} tintColor={colors.textMuted} />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to SearchBar.tsx

- [ ] **Step 4: Commit**

```bash
git add components/SearchBar.tsx
git commit -m "feat(android): update SearchBar SymbolView to cross-platform format"
```

---

### Task 2: Update ModelPicker SymbolView names

**Files:**
- Modify: `components/ModelPicker.tsx:45,47`

- [ ] **Step 1: Update the cpu icon to cross-platform format**

In `components/ModelPicker.tsx`, change line 45 from:
```tsx
<SymbolView name="cpu" size={16} tintColor={colors.textMuted} />
```
to:
```tsx
<SymbolView name={{ ios: 'cpu', android: 'memory' }} size={16} tintColor={colors.textMuted} />
```

- [ ] **Step 2: Update the chevron icon to cross-platform format**

In `components/ModelPicker.tsx`, change line 47 from:
```tsx
<SymbolView name="chevron.down" size={12} tintColor={colors.textMuted} />
```
to:
```tsx
<SymbolView name={{ ios: 'chevron.down', android: 'expand_more' }} size={12} tintColor={colors.textMuted} />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to ModelPicker.tsx

- [ ] **Step 4: Commit**

```bash
git add components/ModelPicker.tsx
git commit -m "feat(android): update ModelPicker SymbolView to cross-platform format"
```

---

### Task 3: Update AvatarRow SymbolView name

**Files:**
- Modify: `components/AvatarRow.tsx:60`

- [ ] **Step 1: Update the plus icon to cross-platform format**

In `components/AvatarRow.tsx`, change line 60 from:
```tsx
<SymbolView name="plus" size={16} tintColor={colors.primary} />
```
to:
```tsx
<SymbolView name={{ ios: 'plus', android: 'add' }} size={16} tintColor={colors.primary} />
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to AvatarRow.tsx

- [ ] **Step 3: Commit**

```bash
git add components/AvatarRow.tsx
git commit -m "feat(android): update AvatarRow SymbolView to cross-platform format"
```

---

### Task 4: Update ExpandableCard icon prop type and SymbolView names

This is the most involved change — the `icon` prop type must broaden to accept both strings and objects, and the internal chevron icon must also be updated.

**Files:**
- Modify: `components/ExpandableCard.tsx:7-9,36,40`

- [ ] **Step 1: Update the icon prop type in the interface**

In `components/ExpandableCard.tsx`, change line 9 from:
```tsx
  icon?: string;
```
to:
```tsx
  icon?: string | { ios: string; android: string };
```

- [ ] **Step 2: Update the dynamic icon SymbolView on line 36**

Change line 36 from:
```tsx
{icon && <SymbolView name={icon as any} size={18} tintColor={colors.textMuted} />}
```
to:
```tsx
{icon && <SymbolView name={icon} size={18} tintColor={colors.textMuted} />}
```

`SymbolView` natively accepts both `string` and `{ ios, android }` objects, so the `as any` cast is no longer needed. If TypeScript rejects the union type for the `name` prop, fall back to `name={icon as any}`.

- [ ] **Step 3: Update the chevron icon to cross-platform format**

Change line 40 from:
```tsx
<SymbolView name="chevron.right" size={14} tintColor={colors.textMuted} />
```
to:
```tsx
<SymbolView name={{ ios: 'chevron.right', android: 'chevron_right' }} size={14} tintColor={colors.textMuted} />
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to ExpandableCard.tsx

- [ ] **Step 5: Commit**

```bash
git add components/ExpandableCard.tsx
git commit -m "feat(android): broaden ExpandableCard icon prop for cross-platform symbols"
```

---

### Task 5: Update ExpandableCard callers (BashOutputCard, GitPanel, ToolResultCard)

**Files:**
- Modify: `components/BashOutputCard.tsx:21`
- Modify: `components/GitPanel.tsx:37`
- Modify: `components/ToolResultCard.tsx:49`

- [ ] **Step 1: Update BashOutputCard icon prop**

In `components/BashOutputCard.tsx`, change line 21 from:
```tsx
      icon="terminal"
```
to:
```tsx
      icon={{ ios: 'terminal', android: 'terminal' }}
```

- [ ] **Step 2: Update GitPanel icon prop**

In `components/GitPanel.tsx`, change line 37 from:
```tsx
        icon="arrow.triangle.branch"
```
to:
```tsx
        icon={{ ios: 'arrow.triangle.branch', android: 'fork_right' }}
```

- [ ] **Step 3: Update ToolResultCard icon variable**

In `components/ToolResultCard.tsx`, change line 49 from:
```tsx
  const icon = isError ? 'xmark.circle' : 'checkmark.circle';
```
to:
```tsx
  const icon = isError
    ? { ios: 'xmark.circle', android: 'cancel' }
    : { ios: 'checkmark.circle', android: 'check_circle' };
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors in any of these files

- [ ] **Step 5: Commit**

```bash
git add components/BashOutputCard.tsx components/GitPanel.tsx components/ToolResultCard.tsx
git commit -m "feat(android): update ExpandableCard callers to cross-platform icon format"
```

---

## Chunk 2: Android Configuration

### Task 6: Update app.json with adaptive icon and cleartext traffic

**Files:**
- Modify: `app.json:54-56`

- [ ] **Step 1: Add adaptiveIcon and usesCleartextTraffic to the android block**

In `app.json`, replace the existing `android` block (lines 54-56):
```json
    "android": {
      "package": "com.gldc.claudecoderemote"
    }
```
with:
```json
    "android": {
      "package": "com.gldc.claudecoderemote",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "usesCleartextTraffic": true
    }
```

- [ ] **Step 2: Verify app.json is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add app.json
git commit -m "feat(android): add adaptive icon and cleartext traffic config"
```

---

### Task 7: Update eas.json preview profile for APK output

**Files:**
- Modify: `eas.json:13-15`

- [ ] **Step 1: Add android buildType to the preview profile**

In `eas.json`, replace the existing `preview` block (lines 13-15):
```json
    "preview": {
      "distribution": "internal"
    },
```
with:
```json
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
```

- [ ] **Step 2: Verify eas.json is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('eas.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add eas.json
git commit -m "feat(android): configure preview profile for APK output"
```

---

## Chunk 3: Prebuild and EAS Builds

### Task 8: Regenerate Android prebuild

**Files:**
- Regenerated: `android/` directory

- [ ] **Step 1: Run expo prebuild for Android**

Run: `npx expo prebuild --platform android --clean`
Expected: The `android/` directory is regenerated with updated AndroidManifest.xml (including `usesCleartextTraffic`), adaptive icon resources, and updated config.

- [ ] **Step 2: Verify AndroidManifest.xml has cleartext traffic enabled**

Run: `grep -c "usesCleartextTraffic" android/app/src/main/AndroidManifest.xml`
Expected: At least 1 match

- [ ] **Step 3: Verify adaptive icon resources were generated**

Run: `ls android/app/src/main/res/mipmap-*/ic_launcher_foreground.webp 2>/dev/null | wc -l`
Expected: Multiple files (one per density: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)

- [ ] **Step 4: Commit**

```bash
git add android/
git commit -m "chore(android): regenerate prebuild with adaptive icon and cleartext config"
```

---

### Task 9: Run EAS development build

- [ ] **Step 1: Run the development build**

Run: `eas build --platform android --profile development`
Expected: Build queues successfully on EAS. Monitor the build URL for completion.

- [ ] **Step 2: Verify build completes**

Run: `eas build:list --platform android --limit 1`
Expected: Latest build shows status `FINISHED` for profile `development`.

---

### Task 10: Run EAS preview build

- [ ] **Step 1: Run the preview build**

Run: `eas build --platform android --profile preview`
Expected: Build queues successfully on EAS. This produces an APK for internal distribution.

- [ ] **Step 2: Verify build completes**

Run: `eas build:list --platform android --limit 1`
Expected: Latest build shows status `FINISHED` for profile `preview`.

---

## Post-Build Verification

After installing on an Android device/emulator, manually verify:

- [ ] All SymbolView icons render correctly (Material Symbols on Android)
- [ ] Cleartext HTTP to CCR server works (session list loads)
- [ ] WebSocket connects and streams messages
- [ ] Push notification token registers with server
- [ ] Push notifications received on Android
- [ ] ActionSheet fallback in ModelPicker works (Alert.alert on Android)
- [ ] Alert.prompt fallback in workflow creation works
- [ ] Keyboard handling works correctly (adjustResize)
- [ ] Adaptive icon displays properly (launcher, recent apps)
- [ ] Splash screen displays on launch
