# Claude Code Remote App

## What This Is

Expo React Native mobile app that connects to a Claude Code Remote (CCR) server over Tailscale VPN. Manages Claude Code sessions from your phone: create sessions, stream output live, approve/deny tool use, and receive push notifications.

## Architecture

```
Expo App (this repo)
├── app/             Expo Router file-based routing
│   ├── _layout      Root layout + providers (QueryClient, GestureHandler, SafeArea)
│   └── (tabs)/      Tab navigator: Sessions, Projects, Settings
├── components/      Shared UI components
├── constants/       Theme (colors, spacing) + slash command registry
└── lib/             API client, WebSocket, Zustand store, types, notifications
```

### State Management

- **Server state**: TanStack React Query (`lib/api.ts`) — sessions, templates, projects, push settings
- **Local state**: Zustand with AsyncStorage persistence (`lib/store.ts`) — host config, transient session messages
- **Real-time**: WebSocket per active session (`lib/websocket.ts`) — streams messages, auto-reconnects on close

### Theming

Dual light/dark theme matching system appearance. Pattern:

```typescript
const colors = useColors();                        // returns LightColors or DarkColors
const styles = useThemedStyles(colors, makeStyles); // memoized StyleSheet factory

const makeStyles = (c: ColorPalette) => StyleSheet.create({ ... });
```

All color tokens live in `constants/theme.ts`. The `ColorPalette` interface has tokens for background, card, text, code blocks, tool cards, tab bar, etc.

**Important**: `app.json` must have `"userInterfaceStyle": "automatic"` for system theme switching. This is a native-level config — changing it requires a dev client rebuild.

### API Client

`lib/api.ts` exports React Query hooks for every endpoint. Base URL comes from Zustand store (`hostConfig.address` + `hostConfig.port`). All requests use `http://` (Tailscale handles encryption).

Key polling intervals: sessions list 5s, individual session 5s, server status 10s, templates/projects 30s.

### WebSocket

`lib/websocket.ts` — `useSessionStream(sessionId)` hook connects to `ws://{host}/ws/sessions/{id}`. Returns `{ messages, isConnected, disconnect }`. Auto-reconnects after 3s. Filters out ping messages.

**Deduplication**: The WebSocket replays the full session message history on each new connection. To prevent duplicates on re-entry, `useSessionStream` calls `clearMessages(sessionId)` on mount before connecting. The WS stream is the single source of truth — stale messages in the Zustand store are wiped each time.

## File Overview

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout — providers, StatusBar style |
| `app/(tabs)/_layout.tsx` | Tab navigator (Sessions, Projects, Settings) |
| `app/(tabs)/sessions/index.tsx` | Session list with filter chips |
| `app/(tabs)/sessions/[id].tsx` | Session detail — message stream, input bar, action menu |
| `app/(tabs)/sessions/[id]/mcp.tsx` | Session MCP servers list with health status |
| `app/(tabs)/sessions/[id]/skills.tsx` | Session available skills list |
| `app/(tabs)/sessions/create.tsx` | Full-screen session creation form |
| `app/(tabs)/sessions/workflows/index.tsx` | Workflow list |
| `app/(tabs)/sessions/workflows/[id].tsx` | Workflow detail with step form and DAG view |
| `app/(tabs)/projects/index.tsx` | Project list with FAB for creating projects |
| `app/(tabs)/projects/[id].tsx` | Project detail with sessions, cloning/error states |
| `app/(tabs)/projects/create.tsx` | Create project — blank (git init) or clone from URL |
| `app/(tabs)/settings/index.tsx` | Settings — server config, push settings |
| `app/(tabs)/settings/templates/index.tsx` | Template list |
| `app/(tabs)/settings/templates/[id].tsx` | Template edit form |
| `app/(tabs)/settings/analytics.tsx` | Usage analytics dashboard |
| `app/(tabs)/settings/mcp.tsx` | MCP server list and health |
| `app/(tabs)/settings/rules.tsx` | Auto-approval rules management |
| `app/(tabs)/settings/usage.tsx` | Claude API usage and rate limits |
| `components/MessageCard.tsx` | Message router — renders correct card by message type |
| `components/AssistantTextCard.tsx` | Markdown renderer for assistant responses |
| `components/ApprovalCard.tsx` | Tool approval/denial UI |
| `components/ToolUseCard.tsx` | Tool invocation display |
| `components/ToolResultCard.tsx` | Tool output display |
| `components/BashOutputCard.tsx` | Bash command output display |
| `components/InputBar.tsx` | Text input + send button |
| `components/CommandAutocomplete.tsx` | Slash command dropdown above input |
| `components/SessionCard.tsx` | Session list item |
| `components/SessionInfoBar.tsx` | Session info bar (project, cost, model, context %) |
| `components/CreateSessionSheet.tsx` | Bottom sheet session creation (BottomSheetScrollView) |
| `components/FilterChips.tsx` | Horizontal filter chip row |
| `components/StatusBadge.tsx` | Session status pill |
| `components/StatusDot.tsx` | Small colored status indicator |
| `components/ErrorCard.tsx` | Error message display |
| `components/ProjectCard.tsx` | Project list item |
| `components/TemplateCard.tsx` | Template list item |
| `components/ModelPicker.tsx` | Model selection chips (reused across create forms) |
| `components/ChipSelector.tsx` | Generic multi-select chip component |
| `components/DAGView.tsx` | Directed acyclic graph visualization for workflow steps |
| `components/DiffViewer.tsx` | Git diff display |
| `components/GitPanel.tsx` | Git status panel for session detail |
| `components/FileList.tsx` | File list display for git changes |
| `components/SearchBar.tsx` | Search input component |
| `components/ExpandableCard.tsx` | Collapsible card wrapper |
| `components/ProgressMeter.tsx` | Progress bar component |
| `components/TimeCountdown.tsx` | Countdown timer display |
| `components/TrendChart.tsx` | Simple trend visualization |
| `components/AnsiRenderer.tsx` | ANSI escape code renderer for terminal output |
| `components/AvatarRow.tsx` | Avatar display row |
| `components/SyntaxHighlightedText.tsx` | Code syntax highlighting |
| `constants/theme.ts` | ColorPalette, LightColors, DarkColors, hooks, spacing/font tokens |
| `constants/commands.ts` | Slash command registry (app + skill commands) |
| `lib/api.ts` | React Query hooks for all REST endpoints |
| `lib/websocket.ts` | WebSocket hook for live session streaming |
| `lib/store.ts` | Zustand store (host config, session messages) |
| `lib/types.ts` | TypeScript interfaces (Session, Template, Project, WSMessageData, etc.) |
| `lib/notifications.ts` | Expo push notification setup and token registration |

## Important Notes

- **No TLS**: App uses `http://` and `ws://` — Tailscale provides WireGuard encryption at the network layer. ATS is disabled via `NSAllowsArbitraryLoads` in `app.json` to allow plain HTTP on iOS.
- **Markdown rendering**: Uses `react-native-marked`. The library hardcodes `backgroundColor: "#000000"` on its FlatList in dark mode — override via `flatListProps.style: { backgroundColor: 'transparent' }`.
- **Message persistence**: User messages and all session messages are stored server-side in `session.messages` and replayed via WebSocket on reconnect. The Zustand store holds transient message state for the current view only — cleared on each WS reconnect. Only `hostConfig` persists locally across app restarts.
- **Slash commands**: Two types — `app` commands (clear, cost) handled locally, `skill` commands (commit, review-pr, simplify, compact) sent as prompts to Claude.
- **Dev client required**: Native config changes (push notifications, app scheme, userInterfaceStyle, ATS) require an EAS build or `npx expo run:ios`, not Expo Go.
- **App icon**: Uses Apple Icon Composer `.icon` bundle format via `ios.icon` in `app.json` (requires Expo SDK 54+).

## OTA Updates

EAS Update is configured with channel-based deployment automated via EAS Workflows.

### Channels

| Channel | Build Profile | Trigger |
|---------|--------------|---------|
| `development` | `development` | None (dev client uses local bundler) |
| `preview` | `preview` | Push to `preview` branch |
| `production` | `production` | Push to `main` branch |

### Branching Workflow

```
feature branch → merge to preview → merge to main
                      ↓                    ↓
                 OTA to preview       OTA to production
```

- Use `preview` to test OTA updates on device before promoting to production.
- Merge directly to `main` only for low-risk changes.
- Native changes (new plugins, SDK upgrades, `app.json` native config) still require `eas build` + store submission — OTA only covers JS/asset changes.

### Config

- `app.json`: `updates.checkAutomatically: "ON_LOAD"`, `runtimeVersion.policy: "fingerprint"`
- `eas.json`: each build profile has a `channel` key
- `.eas/workflows/`: two YAML files trigger OTA updates on branch push (requires GitHub repo linked to EAS)
- `expo-updates` must be guarded with try/catch when imported (crashes in Expo Go) — see `lib/notifications.ts` for the established pattern.

## Session Detail Screen (`sessions/[id].tsx`)

The most complex screen. Key behaviors:
- Connects WebSocket on mount, disconnects on unmount
- Info bar shows: project (branch) | cost | model | context %
- FlatList renders messages via `MessageCard` router
- InputBar with slash command autocomplete
- Approval cards inline in the message stream
- Status change dividers between turns

## Slash Commands

| Command | Type | Behavior |
|---------|------|----------|
| `/clear` | app | Clears local message store |
| `/cost` | app | Shows session cost alert |
| `/compact` | skill | Sent as prompt — Claude compacts context |
| `/commit` | skill | Sent as prompt — Claude creates git commit |
| `/review-pr` | skill | Sent as prompt — Claude reviews PR |
| `/simplify` | skill | Sent as prompt — Claude simplifies code |
