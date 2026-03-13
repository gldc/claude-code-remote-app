# Claude Code Remote App

Manage [Claude Code](https://docs.anthropic.com/en/docs/claude-code) sessions from your phone over a secure Tailscale VPN connection.

```
Expo App (Phone) --> Tailscale VPN --> Mac --> CCR Server --> Claude Code CLI
```

## Features

- **Session management** — Create, stream, pause, archive, and delete Claude Code sessions
- **Live streaming** — Watch Claude's responses in real-time via WebSocket
- **Tool approval** — Approve or deny dangerous tool calls (Write, Edit, Bash) from your phone
- **Slash commands** — `/commit`, `/review-pr`, `/simplify`, `/compact`, `/clear`, `/cost`
- **Session info** — Model name, context window %, git branch, cumulative cost
- **Push notifications** — Get notified on approvals, completions, and errors
- **Dark mode** — System-matching light/dark theme
- **Templates** — Reusable session configurations
- **Project browser** — Scan and register project directories
- **OTA updates** — Channel-based over-the-air updates via EAS Update (preview → production)

## Screenshots

| Light | Dark |
|-------|------|
| *coming soon* | *coming soon* |

## Prerequisites

- [Claude Code Remote](https://github.com/gldc/claude-code-remote) server running on your Mac
- [Tailscale](https://tailscale.com) installed on both Mac and phone, signed into the same account
- iOS device (Android untested)

## Setup

### 1. Start the CCR server on your Mac

```bash
pip install -e ".[dev]"
ccr install        # Register approval hook
ccr start          # Binds to Tailscale IP on port 8080
```

### 2. Build and run the app

```bash
git clone https://github.com/gldc/claude-code-remote-app.git
cd claude-code-remote-app
npm install
npx expo run:ios   # Requires dev client (not Expo Go) for push notifications
```

### 3. Configure the server address

Open the app → Settings tab → enter your Mac's Tailscale IP (e.g., `100.x.y.z`) and port (`8080`).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) ~55 + React Native 0.83 |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| Server state | [TanStack React Query](https://tanstack.com/query) |
| Local state | [Zustand](https://zustand-demo.pmnd.rs/) + AsyncStorage |
| Real-time | WebSocket |
| UI | [Bottom Sheet](https://gorhom.github.io/react-native-bottom-sheet/), [Reanimated](https://docs.swmansion.com/react-native-reanimated/), [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) |
| Markdown | [react-native-marked](https://github.com/gmsec/react-native-marked) |
| Notifications | [Expo Notifications](https://docs.expo.dev/push-notifications/overview/) |
| OTA Updates | [EAS Update](https://docs.expo.dev/eas-update/introduction/) with channel-based deployment |

## Project Structure

```
app/
├── _layout.tsx              Root layout (providers, StatusBar)
├── index.tsx                Redirect to /sessions
└── (tabs)/
    ├── _layout.tsx          Tab navigator
    ├── sessions/            Session list, detail, create
    ├── projects/            Project list, detail
    └── settings/            Server config, push settings, templates
components/                  Shared UI (MessageCard, ApprovalCard, InputBar, etc.)
constants/
├── theme.ts                 Color palettes, spacing, font tokens, hooks
└── commands.ts              Slash command registry
lib/
├── api.ts                   React Query hooks for REST API
├── websocket.ts             WebSocket hook for live streaming
├── store.ts                 Zustand store (host config, messages)
├── types.ts                 TypeScript interfaces
└── notifications.ts         Push notification setup
```

## API Compatibility

This app connects to the [Claude Code Remote](https://github.com/gldc/claude-code-remote) server. Key endpoints used:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/sessions` | List sessions |
| `POST /api/sessions` | Create session |
| `POST /api/sessions/{id}/send` | Send prompt |
| `POST /api/sessions/{id}/approve` | Approve tool use |
| `POST /api/sessions/{id}/deny` | Deny tool use |
| `WS /ws/sessions/{id}` | Live message stream |
| `GET /api/projects` | List projects |
| `GET/POST /api/templates` | Template CRUD |
| `POST /api/push/register` | Register push token |

## Security

All traffic travels over Tailscale's WireGuard-encrypted tunnel. The app uses `http://` and `ws://` protocols — encryption is handled at the network layer by Tailscale. The server authenticates requests via `tailscale whois`.

See [docs/reviews/app-security-review.md](docs/reviews/app-security-review.md) for known security findings and recommendations.

## Cost

The app itself is free. The only cost is your [Claude Code API usage](https://www.anthropic.com/pricing) (usage-based) and Tailscale (free for personal use).

## License

MIT
