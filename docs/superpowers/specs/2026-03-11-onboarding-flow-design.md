# Onboarding Flow Design

## Overview

Bottom sheet with horizontal swipe carousel that appears on first app launch. Guides new users through server setup and app orientation. Dismissible by swiping down (skip).

## Trigger

- `hasOnboarded` boolean in Zustand store, persisted via AsyncStorage
- Shows when `false` (first launch)
- "Replay Onboarding" option in Settings resets the flag
- Once dismissed (skip or complete), never shows again automatically

## Presentation

- `@gorhom/bottom-sheet` with snap points `['85%']`, `index={0}`, `enableDismissOnClose={true}`
- `onClose` callback sets `hasOnboarded = true` (swipe-down dismiss)
- `react-native-pager-view` for horizontal step carousel (avoids gesture conflicts with bottom sheet's vertical pan handler that `FlatList` + `pagingEnabled` would cause)
- Bar-style progress indicators (5 bars, filled as user advances)
- "Skip" text button in top-right of each step (except Done) — **dismisses the entire onboarding** (same as swipe-down), not just the current step
- Swipe down on sheet to dismiss at any point
- Step 2 text inputs: use `BottomSheetTextInput` from `@gorhom/bottom-sheet` for proper keyboard handling inside the sheet

## Steps

### Step 1 — Welcome

- **Hero**: Primary/terracotta gradient, phone ⟷ laptop illustration
- **Content**: App name, one-liner ("Control Claude Code sessions from anywhere over your secure Tailscale network")
- **Action**: Link to CCR server GitHub repo with "Set up the server first" prompt
- **CTA**: "Get Started →"
- **Gated**: No

### Step 2 — Connect Server

- **Hero**: Success/green gradient, connection icon
- **Content**: Tailscale address input (placeholder: "macbook.tailnet-xxxx"), port input (default: 8080)
- **Validation**: "Test Connection" triggers a server status API call. Must succeed before Next is enabled.
- **Success state**: Green banner — "Connected — N active sessions"
- **Error state**: Inline error — "Could not reach server — check the address and make sure Tailscale is connected"
- **Action**: Saves `hostConfig` (address + port) to Zustand store (same store Settings uses)
- **CTA**: "Next →" (disabled until connection validated)
- **Gated**: Yes

### Step 3 — Feature Highlights

- **Hero**: None — the feature cards serve as the visual content
- **Content**: Three colored cards:
  - Sessions (primary accent) — "Create, stream, and approve tool use"
  - Projects (success accent) — "Manage repos and clone from Git"
  - Settings (info/blue accent) — "Templates, MCP servers, approval rules"
- **CTA**: "Next →"
- **Gated**: No

### Step 4 — Notifications

- **Hero**: Warning/amber gradient, bell icon
- **Content**: Explains what notifications are used for (approval requests, session completions, errors). No toggles — the fine-grained toggle controls already exist in Settings. This step is just for the iOS permission prompt.
- **Action**: CTA calls `getExpoPushToken()` from `lib/notifications.ts`, which triggers the iOS permission dialog and returns the push token. If the server is connected (Step 2 was completed), the existing `useNotificationSetup()` hook in `app/_layout.tsx` will handle server-side token registration on next render cycle.
- **CTA**: "Enable Notifications →"
- **Secondary**: "Not now" text link advances without prompting
- **Footer**: "You can customize notification types in Settings"
- **Gated**: No — advances regardless of permission outcome

### Step 5 — Done

- **Hero**: Success/green gradient, party emoji
- **Content**: "You're all set!" summary, encouragement to start first session
- **No Skip button** — only the final CTA
- **CTA**: "Start Your First Session" — dismisses sheet, sets `hasOnboarded = true`, navigates to Sessions tab and opens `CreateSessionSheet`

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `components/OnboardingSheet.tsx` | Bottom sheet + carousel container, progress bars, skip handler |
| `components/onboarding/WelcomeStep.tsx` | Step 1 content |
| `components/onboarding/ConnectStep.tsx` | Step 2 content + connection validation |
| `components/onboarding/FeaturesStep.tsx` | Step 3 content |
| `components/onboarding/NotificationsStep.tsx` | Step 4 content + permission request |
| `components/onboarding/DoneStep.tsx` | Step 5 content |

### Modified Files

| File | Change |
|------|--------|
| `lib/store.ts` | Add `hasOnboarded` boolean + `setHasOnboarded` action. Must update `partialize` to include `hasOnboarded` so it persists across restarts. |
| `app/_layout.tsx` | Render `<OnboardingSheet>` when `hasOnboarded === false` |
| `app/(tabs)/settings/index.tsx` | Add "Replay Onboarding" button in a new "App" section at the bottom, resets `hasOnboarded` |

### Data Flow

1. App launches → Zustand loads `hasOnboarded` from persistence
2. `app/_layout.tsx` conditionally renders `<OnboardingSheet>` over the tab navigator
3. Step 2 writes `hostConfig` to Zustand (same path as Settings screen)
4. Step 4 calls `getExpoPushToken()` for iOS permission; `useNotificationSetup()` in `_layout.tsx` handles server registration
5. Completion or skip sets `hasOnboarded = true`

### Visual Design

- Each step hero uses a different accent gradient from the theme palette (primary, success, info, warning)
- All colors from `constants/theme.ts` — supports light and dark mode
- Sheet background: `colors.card`, text: `colors.text` / `colors.textMuted`
- Progress bars: filled = `colors.primary`, unfilled = `colors.cardBorder`

## Error Handling

- **Connection test fails**: Inline error below inputs, Next stays disabled. User can retry or dismiss the entire onboarding via Skip/swipe-down.
- **User skips onboarding early**: `hostConfig` stays empty (unless they completed Step 2), app shows empty states. Settings screen is the fallback for all configuration.
- **Notification permission denied**: Step advances normally. Settings is fallback for enabling later.
- **Sheet dismissed (swipe down)**: Sets `hasOnboarded = true`. User configures manually via Settings.

## Testing

- Zustand `hasOnboarded` flag: persistence, reset, initial state
- Each step component: renders correctly, correct hero colors, correct content
- ConnectStep: validates connection, disables/enables Next, saves hostConfig
- NotificationsStep: triggers permission request, handles denial gracefully
- Integration: full flow launch → complete → flag set → sheet doesn't reappear on next launch
