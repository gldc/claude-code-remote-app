# Project Terminal — Design Document

**Date:** 2026-03-09

## Summary

Add a fully interactive terminal to the Projects tab. Each project gets a terminal icon in its detail header that opens a full-screen terminal emulator. The terminal connects to the CCR server over WebSocket, which spawns a PTY (pseudo-terminal) in the project's working directory.

## Architecture

```
User keystroke → xterm.js onData → WebSocket → FastAPI → PTY stdin
PTY stdout → FastAPI → WebSocket → xterm.js renders
```

Two pieces of work:

1. **Server-side (Python/FastAPI):** New PTY WebSocket endpoint at `/ws/terminal/{project_id}` that spawns a shell in the project directory, pipes stdin/stdout bidirectionally.
2. **App-side (Expo):** DOM component with xterm.js, a terminal screen, a key toolbar, and a header icon entry point.

## Server-Side Design

**New file:** `src/claude_code_remote/terminal.py`

**Endpoint:** `WebSocket /ws/terminal/{project_id}`

### Behavior

- On first connection for a project, spawns a shell (`$SHELL` or `/bin/zsh`) via Python's `pty` module in the project's working directory.
- Stores the PTY process in a dict keyed by `project_id`.
- Bidirectional message flow:
  - **Client → Server:** `{"type": "input", "data": "ls\n"}` → written to PTY stdin
  - **Client → Server:** `{"type": "resize", "cols": 80, "rows": 24}` → sends `SIGWINCH` to PTY
  - **Server → Client:** Raw PTY output bytes sent as text WebSocket frames (xterm.js consumes raw terminal output directly)
- If a PTY is already running for that project, new connections attach to the existing one and replay a buffer of recent output (16KB) for context.
- Registered in `server.py` alongside the existing WebSocket router.

### Lifecycle & Cleanup

- One PTY per project, created on first connect.
- Idle timeout: **2 hours** with no connected WebSocket clients. Reset on any PTY output.
- Explicit close: client sends `{"type": "close"}` or user types `exit`.
- On PTY process death: server sends a WebSocket close frame.

## App-Side Design

### New Files

#### `components/TerminalView.tsx` (DOM Component)

- `"use dom"` directive at top.
- Imports `xterm` and `@xterm/addon-fit` (web libraries, run in WebView context).
- Props:
  - `wsUrl: string` — WebSocket URL for the PTY endpoint
  - `onClose: () => Promise<void>` — native callback for back navigation
  - `onSendKey: never` — receives key events from native toolbar (see below)
  - `dom: import("expo/dom").DOMProps`
- On mount: creates xterm.js `Terminal`, opens it in a `<div>` ref, connects to the WebSocket URL.
- `term.onData(data)` → sends `{"type": "input", "data": ...}` over WebSocket.
- WebSocket `onmessage` → `term.write(data)`.
- `fitAddon.fit()` on mount + window resize → sends `{"type": "resize", "cols": ..., "rows": ...}` to server.
- Inline CSS for dark background, full-height layout, no scrollbars.
- Cleanup: disconnect WebSocket and dispose terminal on unmount.

#### `app/(tabs)/projects/terminal.tsx` (Screen)

- Receives `projectId` via route search params.
- Constructs `wsUrl` from Zustand `hostConfig`: `ws://{address}:{port}/ws/terminal/{projectId}`.
- Renders `<TerminalView>` full-screen with `dom={{ scrollEnabled: false, contentInsetAdjustmentBehavior: "never", style: { flex: 1 } }}`.
- Renders native **key toolbar** above the keyboard.

### Modified Files

#### `app/(tabs)/projects/[id].tsx`

- Add a terminal icon (`Ionicons: "terminal-outline"`) button in the project detail header.
- On press: `router.push({ pathname: '/projects/terminal', params: { id: project.id } })`.

### Key Toolbar

A native `View` positioned above the virtual keyboard with buttons for keys not easily accessible on mobile:

- **Tab**, **Esc**, **Ctrl** (toggle/modifier), **Arrow keys** (↑ ↓ ← →)
- Styled to match the app's theme.
- Sends key events to the DOM component via async prop callback.

### Dependencies

- `xterm` (npm)
- `@xterm/addon-fit` (npm)

Both are web-only libraries used exclusively inside the DOM component.

## Error Handling & Edge Cases

- **Server unreachable:** Display connection failure message in xterm.js (`term.write("\r\nConnection failed. Retrying...")`). Retry with backoff.
- **PTY process dies** (e.g., user types `exit`): Server sends a WebSocket close frame. App shows "Terminal session ended" with option to restart.
- **WebSocket disconnect / app backgrounded:** On reconnect, server replays 16KB output buffer for context. xterm.js picks up where it left off.
- **Idle timeout:** Server kills PTY after 2 hours with no connected clients (timer resets on PTY output). Next connect spawns a fresh shell.
- **Resize:** `fitAddon.fit()` fires on DOM component resize → sends cols/rows to server → server sends `SIGWINCH` to PTY. Handles device rotation and iPad multitasking.

## Known Limitations

- **Android xterm.js `onData` bug** (xtermjs/xterm.js#5108): Keystrokes may only fire on Enter key press, not on every keystroke. iOS works correctly. Monitor upstream for fix.
- **WebView cold start:** First load may take 1-2 seconds due to WebView initialization. Subsequent loads are faster.

## Out of Scope

- Multiple terminals per project
- SSH (uses existing WebSocket transport over Tailscale)
- tmux integration (the PTY itself is the shell)
- Authentication beyond Tailscale (matches existing pattern)

## Platform Behavior

| Platform | Terminal Rendering |
|----------|-------------------|
| iOS | xterm.js in WKWebView (via DOM component) |
| Android | xterm.js in WebView (via DOM component) |
| Web | xterm.js renders as-is (no WebView wrapper) |
