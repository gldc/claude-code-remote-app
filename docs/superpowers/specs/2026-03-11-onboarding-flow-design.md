# Onboarding Flow Design

## Overview

Bottom sheet with horizontal swipe carousel that appears on first app launch. Guides new users through server setup and app orientation. Dismissible by swiping down (skip).

## Trigger

- `hasOnboarded` boolean in Zustand store, persisted via AsyncStorage
- Shows when `false` (first launch)
- "Replay Onboarding" option in Settings resets the flag
- Once dismissed (skip or complete), never shows again automatically

## Presentation

- `@gorhom/bottom-sheet` at ~85% snap point, overlaying the main app (Sessions tab dimmed behind)
- Horizontal `FlatList` with `pagingEnabled` (or `react-native-pager-view`) for step carousel
- Bar-style progress indicators (5 bars, filled as user advances)
- "Skip" text button in top-right of each step (except Done)
- Swipe down on sheet to dismiss at any point

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
- **Content**: Toggle switches for three notification types (all on by default):
  - Approval Requests
  - Session Completions
  - Session Errors
- **Action**: CTA triggers `registerForPushNotificationsAsync()` from `lib/notifications.ts`, which prompts iOS permission dialog
- **CTA**: "Enable Notifications →"
- **Footer**: "You can change these later in Settings"
- **Gated**: No — advances regardless of permission outcome

### Step 5 — Done

- **Hero**: Success/green gradient, party emoji
- **Content**: "You're all set!" summary, encouragement to start first session
- **No Skip button** — only the final CTA
- **CTA**: "Start Your First Session" — dismisses sheet, sets `hasOnboarded = true`, opens create session flow

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
| `lib/store.ts` | Add `hasOnboarded` boolean + `setHasOnboarded` action to persisted state |
| `app/_layout.tsx` | Render `<OnboardingSheet>` when `hasOnboarded === false` |
| `app/(tabs)/settings/index.tsx` | Add "Replay Onboarding" button that resets `hasOnboarded` |

### Data Flow

1. App launches → Zustand loads `hasOnboarded` from persistence
2. `app/_layout.tsx` conditionally renders `<OnboardingSheet>` over the tab navigator
3. Step 2 writes `hostConfig` to Zustand (same path as Settings screen)
4. Step 4 calls existing `registerForPushNotificationsAsync()`
5. Completion or skip sets `hasOnboarded = true`

### Visual Design

- Each step hero uses a different accent gradient from the theme palette (primary, success, info, warning)
- All colors from `constants/theme.ts` — supports light and dark mode
- Sheet background: `colors.card`, text: `colors.text` / `colors.textMuted`
- Progress bars: filled = `colors.primary`, unfilled = `colors.cardBorder`

## Error Handling

- **Connection test fails**: Inline error below inputs, Next stays disabled. User can retry or skip.
- **User skips at step 2**: `hostConfig` stays empty, app shows empty states. Settings screen is the fallback.
- **Notification permission denied**: Step advances normally. Toggles reflect denied state. Settings is fallback.
- **Sheet dismissed (swipe down)**: Sets `hasOnboarded = true`. User configures manually via Settings.

## Testing

- Zustand `hasOnboarded` flag: persistence, reset, initial state
- Each step component: renders correctly, correct hero colors, correct content
- ConnectStep: validates connection, disables/enables Next, saves hostConfig
- NotificationsStep: triggers permission request, handles denial gracefully
- Integration: full flow launch → complete → flag set → sheet doesn't reappear on next launch
