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

## File Overview

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout — providers, StatusBar style |
| `app/(tabs)/_layout.tsx` | Tab navigator (Sessions, Projects, Settings) |
| `app/(tabs)/sessions/index.tsx` | Session list with filter chips |
| `app/(tabs)/sessions/[id].tsx` | Session detail — message stream, input bar, info bar |
| `app/(tabs)/sessions/create.tsx` | Full-screen session creation form |
| `app/(tabs)/projects/index.tsx` | Project list |
| `app/(tabs)/projects/[id].tsx` | Project detail with recent sessions |
| `app/(tabs)/settings/index.tsx` | Settings — server config, push settings |
| `app/(tabs)/settings/templates/index.tsx` | Template list |
| `app/(tabs)/settings/templates/[id].tsx` | Template edit form |
| `components/MessageCard.tsx` | Message router — renders correct card by message type |
| `components/AssistantTextCard.tsx` | Markdown renderer for assistant responses |
| `components/ApprovalCard.tsx` | Tool approval/denial UI |
| `components/ToolUseCard.tsx` | Tool invocation display |
| `components/ToolResultCard.tsx` | Tool output display |
| `components/InputBar.tsx` | Text input + send button |
| `components/CommandAutocomplete.tsx` | Slash command dropdown above input |
| `components/SessionCard.tsx` | Session list item |
| `components/CreateSessionSheet.tsx` | Bottom sheet session creation |
| `components/FilterChips.tsx` | Horizontal filter chip row |
| `components/StatusBadge.tsx` | Session status pill |
| `components/ErrorCard.tsx` | Error message display |
| `components/ProjectCard.tsx` | Project list item |
| `components/TemplateCard.tsx` | Template list item |
| `constants/theme.ts` | ColorPalette, LightColors, DarkColors, hooks, spacing/font tokens |
| `constants/commands.ts` | Slash command registry (app + skill commands) |
| `lib/api.ts` | React Query hooks for all REST endpoints |
| `lib/websocket.ts` | WebSocket hook for live session streaming |
| `lib/store.ts` | Zustand store (host config, session messages) |
| `lib/types.ts` | TypeScript interfaces (Session, Template, Project, WSMessageData, etc.) |
| `lib/notifications.ts` | Expo push notification setup and token registration |

## Important Notes

- **No TLS**: App uses `http://` and `ws://` — Tailscale provides WireGuard encryption at the network layer.
- **Markdown rendering**: Uses `react-native-marked`. The library hardcodes `backgroundColor: "#000000"` on its FlatList in dark mode — override via `flatListProps.style: { backgroundColor: 'transparent' }`.
- **Session messages are transient**: Not persisted to AsyncStorage. Only `hostConfig` persists across app restarts.
- **Slash commands**: Two types — `app` commands (clear, cost) handled locally, `skill` commands (commit, review-pr, simplify, compact) sent as prompts to Claude.
- **Dev client required**: Native config changes (push notifications, app scheme, userInterfaceStyle) require `npx expo run:ios` or an EAS build, not Expo Go.

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
