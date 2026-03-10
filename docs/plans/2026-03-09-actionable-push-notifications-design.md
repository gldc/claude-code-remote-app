# Actionable Push Notifications for Tool Approval

## Context

Push notifications for approval requests are now wired up, but tapping one just opens the session detail screen. Users should be able to approve or deny tool use directly from the notification without opening the app.

## Design

### Notification UX

**Banner**: `"Approval Needed"` / `"Session 'X' wants to run Bash"`

**Expanded (long-press)**: Full body with tool input details + Approve/Deny buttons. Grouped per session via `threadId`.

```
Approval Needed
Session 'my-session' wants to run:
Bash: rm -rf node_modules && npm install

[ Deny ]  [ Approve ]
```

**Confirmation push** (after action, no sound):

```
Approved
Bash in 'my-session'
```

### Actions

| Action | Behavior |
|--------|----------|
| Approve button | Background — calls `POST /api/sessions/{id}/approve`, server sends confirmation push |
| Deny button | Background — calls `POST /api/sessions/{id}/deny` (no reason), server sends confirmation push |
| Tap notification body | Opens app, navigates to session detail |

### Client changes — `lib/notifications.ts`

1. Register `approval_request` category on startup with two actions:
   - `approve`: `opensAppToForeground: false`
   - `deny`: `isDestructive: true`, `opensAppToForeground: false`

2. Response listener branches on `actionIdentifier`:
   - `"approve"` / `"deny"` — plain `fetch` using `useAppStore.getState().hostConfig` for base URL (outside React context)
   - Default tap — `router.push()` to session

### Server changes — `push.py`

1. `send()` accepts optional `category` and `thread_id`, includes `categoryIdentifier` and `threadId` in Expo payload.

2. `notify_approval(session_name, tool_name, tool_input, session_id)`:
   - `category="approval_request"`, `thread_id=session_id`
   - Richer body: Bash shows command, Edit/Write shows file path, others show truncated JSON input
   - `data` dict includes `tool_name`

3. New `notify_action_confirmed(session_name, tool_name, action, session_id)`:
   - Soundless confirmation push (`"sound": null`)
   - Title: `"Approved"` or `"Denied"`
   - Body: `"{tool_name} in '{session_name}'"`
   - Same `thread_id=session_id` for grouping

### Server changes — `session_manager.py`

1. Pass `tool_input` to `notify_approval()` (currently only passes `tool_name`)

### Server changes — `routes.py`

1. After resolving the approval future in approve/deny endpoints, call `notify_action_confirmed()` via `push_mgr` from `app.state`

### Out of scope

- Haptics (actions run in background)
- Badge count
- Text input for deny reason
- Retry on failed approve/deny from notification
- Notification service extension
