# Claude Code Remote — Expo iOS App

## Overview

Native iOS app built with Expo that connects to the claude-code-remote API server over Tailscale to create, monitor, and manage Claude Code sessions with structured message rendering, inline tool approvals, and push notifications.

## Architecture

```
Expo Router App (iOS)
├── Tab 1: Sessions
│   ├── Session List (cards with status)
│   └── Session Detail (structured message feed + input)
├── Tab 2: Projects
│   ├── Project List (with session counts)
│   └── Project Detail (sessions for project)
├── Tab 3: Settings
│   ├── Host Management
│   ├── Templates (CRUD)
│   ├── Notification Preferences
│   └── Server Status
├── Push Notification Handler
├── API Client (REST + WebSocket)
└── Deep Linking (from notifications)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK (latest) |
| Navigation | Expo Router (file-based, tabs + stacks) |
| Styling | React Native StyleSheet (dark theme) |
| State | React Query (TanStack Query) for REST, zustand for local state |
| WebSocket | React Native WebSocket (built-in) |
| Push | expo-notifications |
| Markdown | react-native-markdown-display |
| Icons | @expo/vector-icons |

## Screen Details

### Tab 1: Sessions

#### Session List (`/(tabs)/sessions/index.tsx`)

- Pull-to-refresh list of all sessions
- Each card shows:
  - Session name
  - Project name + icon
  - Status badge (color-coded: green=running, yellow=awaiting, blue=completed, red=error, gray=paused)
  - Last message preview (truncated)
  - Cost so far
  - Time elapsed / completed ago
- FAB or header button to create new session
- Filter chips: All, Running, Awaiting, Completed
- Swipe to delete completed sessions

#### Create Session (`/(tabs)/sessions/create.tsx`)

- Session name input
- Project picker (from `/api/projects`)
- Initial prompt (multiline text input with voice dictation)
- Template picker (optional — pre-fills fields)
- Model selector (optional override)
- Budget cap (optional)
- "Create" button

#### Session Detail (`/(tabs)/sessions/[id].tsx`)

- Header: session name, project, status badge, cost
- Scrollable message feed with structured cards:

**Message Card Types:**

1. **Assistant Text** — Markdown-rendered text block, dark background
2. **Tool Use** — Collapsible card showing:
   - Tool name (e.g., "Edit", "Bash", "Read")
   - Tool icon
   - Input parameters (syntax-highlighted for code)
   - Expandable to show full detail
3. **Tool Result** — Collapsible card showing:
   - Success/error indicator
   - Output content (syntax-highlighted)
   - File diffs rendered as unified diff
4. **Approval Request** — Prominent card with:
   - Tool name and description of what it wants to do
   - Full parameter preview (file paths, commands, code changes)
   - "Approve" (green) and "Deny" (red) buttons
   - Optional deny reason input
5. **Error** — Red-tinted card with error message
6. **Cost/Usage** — Subtle inline showing tokens used, cost

**Input bar** at bottom:
- Text input with iOS voice dictation
- Send button
- Disabled when session is completed/error

**Header actions:**
- Pause (interrupt) button
- Stop button (with confirmation)

### Tab 2: Projects

#### Project List (`/(tabs)/projects/index.tsx`)

- List of discovered projects
- Each row: project name, path, type badge (python/node/rust/go), session count
- Pull-to-refresh (triggers rescan)
- "Add Project" button (manual path entry)
- Tap to view project detail

#### Project Detail (`/(tabs)/projects/[id].tsx`)

- Project info (name, path, type)
- List of sessions for this project (same cards as session list)
- "New Session" button (pre-fills project)

### Tab 3: Settings

#### Settings Root (`/(tabs)/settings/index.tsx`)

- **Host Connection**
  - Host address (Tailscale IP or MagicDNS name)
  - Connection status indicator
  - Port (default 8080)
- **Templates** → navigates to template list
- **Notifications**
  - Toggle: approval requests (default on)
  - Toggle: session completions (default on)
  - Toggle: session errors (default on)
- **Server Info**
  - Server version, uptime
  - Active sessions count
  - Tailscale node info

#### Template List (`/(tabs)/settings/templates/index.tsx`)

- List of saved templates
- Tap to edit, swipe to delete
- "New Template" button

#### Template Editor (`/(tabs)/settings/templates/[id].tsx`)

- Name input
- Project directory (optional)
- Initial prompt (multiline)
- Model selector
- Budget cap
- Allowed tools (multi-select)
- Save / Delete buttons

## API Client

### REST Client (`lib/api.ts`)

- Base URL from settings (e.g., `http://macbook.tailnet-xxxx:8080`)
- All requests include standard headers
- React Query hooks for each endpoint:
  - `useSessionsList(filters?)`
  - `useSession(id)`
  - `useCreateSession()`
  - `useDeleteSession()`
  - `useSendPrompt(sessionId)`
  - `useApproveToolUse(sessionId)`
  - `useDenyToolUse(sessionId)`
  - `usePauseSession(sessionId)`
  - `useProjectsList()`
  - `useTemplatesList()`
  - `useCreateTemplate()`
  - `useUpdateTemplate()`
  - `useDeleteTemplate()`
  - `useServerStatus()`
  - `usePushSettings()`
  - `useUpdatePushSettings()`

### WebSocket Client (`lib/websocket.ts`)

- Connect to `ws://<host>:<port>/ws/sessions/{id}` when viewing session detail
- Auto-reconnect on disconnect
- Parse incoming events and append to local session message state
- Disconnect when navigating away from session detail

### Hook: `useSessionStream(sessionId)`

- Manages WebSocket lifecycle
- Returns: `{ messages, status, isConnected }`
- Appends new events to message array in real-time
- Updates session status on status_change events

## Push Notifications

### Setup (`lib/notifications.ts`)

- On app launch: request permissions, get ExpoPushToken
- Register token with server: `POST /api/push/register`
- Handle incoming notifications:
  - Foreground: show in-app banner
  - Background: system notification
  - Tap: deep link to session detail

### Deep Linking

Notification `data` contains `session_id` and `type`:
- `approval_request` → navigate to session detail, scroll to approval card
- `session_completed` → navigate to session detail
- `session_error` → navigate to session detail

## State Management

### Server State (React Query)

- Session list, project list, templates, server status
- Polling: session list refreshes every 5 seconds when on sessions tab
- Stale time: 3 seconds for sessions, 30 seconds for projects/templates

### Local State (Zustand)

- `hostConfig`: { address, port }
- `activeSessionMessages`: Map of session ID → message array (fed by WebSocket)
- Persisted to AsyncStorage: host config, notification preferences

## Design / Theme

- Dark mode only (matches terminal aesthetic, optimized for iPhone)
- Color palette:
  - Background: near-black (#0D1117)
  - Cards: dark gray (#161B22)
  - Primary accent: blue (#58A6FF)
  - Success: green (#3FB950)
  - Warning: yellow (#D29922)
  - Error: red (#F85149)
  - Text: white (#E6EDF3)
  - Muted text: gray (#8B949E)
- Status badge colors match the palette above
- Monospace font for code blocks and tool I/O
- Native iOS feel with smooth animations

## File Structure

```
claude-code-remote-app/
├── app/
│   ├── _layout.tsx                    # Root layout
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Tab navigator
│   │   ├── sessions/
│   │   │   ├── index.tsx              # Session list
│   │   │   ├── create.tsx             # Create session
│   │   │   └── [id].tsx               # Session detail
│   │   ├── projects/
│   │   │   ├── index.tsx              # Project list
│   │   │   └── [id].tsx               # Project detail
│   │   └── settings/
│   │       ├── index.tsx              # Settings root
│   │       └── templates/
│   │           ├── index.tsx          # Template list
│   │           └── [id].tsx           # Template editor
├── lib/
│   ├── api.ts                         # REST client + React Query hooks
│   ├── websocket.ts                   # WebSocket client
│   ├── notifications.ts              # Push notification setup
│   ├── store.ts                       # Zustand store
│   └── types.ts                       # Shared TypeScript types
├── components/
│   ├── SessionCard.tsx                # Session list card
│   ├── MessageCard.tsx                # Base message card
│   ├── AssistantTextCard.tsx          # Markdown text block
│   ├── ToolUseCard.tsx                # Tool use display
│   ├── ToolResultCard.tsx             # Tool result display
│   ├── ApprovalCard.tsx               # Approve/deny UI
│   ├── ErrorCard.tsx                  # Error display
│   ├── StatusBadge.tsx                # Color-coded status pill
│   ├── ProjectCard.tsx                # Project list row
│   ├── TemplateCard.tsx               # Template list row
│   ├── InputBar.tsx                   # Text input + send
│   └── FilterChips.tsx                # Status filter chips
├── constants/
│   └── theme.ts                       # Colors, spacing, typography
├── docs/
│   └── plans/
│       └── 2026-03-07-expo-app-design.md
├── app.json
├── package.json
└── tsconfig.json
```

## Security

- App only connects over Tailscale network
- No credentials stored in app — Tailscale node identity is the auth
- No data cached locally beyond host config and notification preferences
- Message history lives on server, not on device
