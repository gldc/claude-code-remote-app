# Android EAS Build Support

**Date:** 2026-03-11
**Status:** Approved
**Goal:** Enable Android development and preview builds via EAS

## Context

The Claude Code Remote App is an Expo React Native app currently built and tested on iOS only. The codebase already has extensive Android platform handling (keyboard events, shadows, fonts, ActionSheet/Alert fallbacks), an `android/` prebuild directory, and an EAS project configured. The app connects to a CCR server over Tailscale using cleartext HTTP/WS.

Push notifications use Expo's push service (`exp.host/--/api/v2/push/send`), which transparently handles FCM on Android. No `google-services.json` or Firebase project is needed.

## Scope

- Development client and preview (internal distribution) builds only
- Google Play Store submission is out of scope for now

## Changes Required

### 1. Update `expo-symbols` to cross-platform format

The app uses `expo-symbols` (`SymbolView`) in 5 components, but passes SF Symbol names as plain strings (iOS-only). As of SDK 55, `expo-symbols` supports Android via Material Symbols and web via Material Symbols (verified in Expo docs). The `name` prop must be changed from a string to a `{ ios, android }` object for cross-platform rendering.

> **Note:** `expo-symbols` is in beta. If the cross-platform `{ ios, android }` name API does not work as documented in `expo-symbols ~55.0.5`, the fallback plan is to replace with `@expo/vector-icons` (Ionicons).

**Affected components and icons:**

| Component | File | Current SF Symbol | Android Material Symbol |
|-----------|------|-------------------|------------------------|
| SearchBar | `components/SearchBar.tsx` | `magnifyingglass` | `search` |
| SearchBar | `components/SearchBar.tsx` | `xmark.circle.fill` | `cancel` |
| ModelPicker | `components/ModelPicker.tsx` | `cpu` | `memory` |
| ModelPicker | `components/ModelPicker.tsx` | `chevron.down` | `expand_more` |
| ExpandableCard | `components/ExpandableCard.tsx` | `chevron.right` | `chevron_right` |
| AvatarRow | `components/AvatarRow.tsx` | `plus` | `add` |

**Callers of ExpandableCard that pass an `icon` prop:**

| Caller | File | Current SF Symbol | Android Material Symbol |
|--------|------|-------------------|------------------------|
| BashOutputCard | `components/BashOutputCard.tsx` | `terminal` | `terminal` |
| GitPanel | `components/GitPanel.tsx` | `arrow.triangle.branch` | `fork_right` |
| ToolResultCard | `components/ToolResultCard.tsx` | `checkmark.circle` | `check_circle` |
| ToolResultCard | `components/ToolResultCard.tsx` | `xmark.circle` | `cancel` |

**Type change:** The `ExpandableCard` `icon` prop type broadens from `string` to `string | { ios: string; android: string }` to support both formats. Callers update to pass objects.

### 2. Add Android adaptive icon to `app.json`

Assets already exist in `assets/images/`. Add `adaptiveIcon` to the **existing** `android` block in `app.json` (which already has `package`):

```json
"android": {
  "package": "com.gldc.claudecoderemote",
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/android-icon-foreground.png",
    "backgroundImage": "./assets/images/android-icon-background.png",
    "monochromeImage": "./assets/images/android-icon-monochrome.png"
  }
}
```

This provides adaptive icons on all Android versions, including Material You monochrome on Android 13+.

### 3. Enable cleartext HTTP traffic on Android

The app uses `http://` and `ws://` because Tailscale handles encryption at the network layer. iOS has `NSAllowsArbitraryLoads: true` in the ATS config. Android needs the equivalent.

Add `"usesCleartextTraffic": true` to the `android` block in `app.json`. This is the Android equivalent of the iOS ATS bypass.

### 4. Regenerate Android prebuild

After config changes, run:

```
npx expo prebuild --platform android --clean
```

This regenerates the `android/` directory with the updated manifest, icons, and network security config. The `android/` directory is checked into version control as prebuild output — `--clean` will wipe and regenerate it cleanly.

### 5. Update `eas.json` preview profile for APK output

The `preview` profile currently only sets `"distribution": "internal"`. By default, EAS Build for Android produces an AAB (Android App Bundle), not an APK. For internal distribution without the Play Store, add `buildType: "apk"`:

```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```

### 6. Run EAS builds

```
eas build --platform android --profile development
eas build --platform android --profile preview
```

The development profile produces a dev client for local testing. The preview profile produces an APK for internal distribution.

## What's NOT Needed

- **No `google-services.json`** -- Expo push service handles FCM transparently
- **No new dependencies** -- `expo-symbols` already supports Android via Material Symbols; `@expo/vector-icons` not needed
- **No platform-specific code changes beyond icons** -- keyboard handling, shadows, fonts, ActionSheet, Alert.prompt all already have proper Android fallbacks
- **No Play Store setup** -- out of scope for this iteration

## Files Modified

| File | Change |
|------|--------|
| `app.json` | Add `adaptiveIcon` and `usesCleartextTraffic` to `android` block |
| `components/SearchBar.tsx` | Update `SymbolView` name props to `{ ios, android }` objects |
| `components/ModelPicker.tsx` | Update `SymbolView` name props to `{ ios, android }` objects |
| `components/ExpandableCard.tsx` | Update `icon` prop type; update chevron `SymbolView` name prop |
| `components/BashOutputCard.tsx` | Update `icon` prop to `{ ios, android }` object |
| `components/GitPanel.tsx` | Update `icon` prop to `{ ios, android }` object |
| `components/AvatarRow.tsx` | Update `SymbolView` name prop to `{ ios, android }` object |
| `components/ToolResultCard.tsx` | Update `icon` prop to `{ ios, android }` object |
| `eas.json` | Add `android.buildType: "apk"` to preview profile |

## Splash Screen

The existing `expo-splash-screen` plugin config (backgroundColor, image, imageWidth) works cross-platform. No Android-specific splash overrides are needed. Can be refined later if desired.

## Verification Checklist

After the builds are running on an Android device/emulator:

- [ ] All `SymbolView` icons render correctly (Material Symbols on Android)
- [ ] Cleartext HTTP to CCR server works (session list loads)
- [ ] WebSocket connects and streams messages
- [ ] Push notification token registers with server
- [ ] Push notifications received on Android
- [ ] ActionSheet fallback in ModelPicker works (Alert.alert on Android)
- [ ] Alert.prompt fallback in workflow creation works
- [ ] Keyboard handling works correctly (adjustResize)
- [ ] Adaptive icon displays properly (launcher, recent apps)
- [ ] Splash screen displays on launch

## Risk Assessment

- **Low risk:** All changes are additive (icon format broadening, config additions). No existing iOS behavior changes.
- **Icons may need visual tuning:** Material Symbol names are best-effort mappings. May need adjustment after seeing them on a real Android device.
- **`expo-symbols` is in beta:** The library notes it is "subject to breaking changes." If issues arise, fallback plan is to swap to `@expo/vector-icons` (Ionicons) as originally considered.
