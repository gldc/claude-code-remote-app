# Mobile App Code & Security Review

## Executive Summary

Well-structured React Native/Expo app with clean file organization and consistent patterns. However, there are critical security issues and significant performance concerns. The most serious finding is that all network traffic uses plaintext HTTP/WS with zero authentication.

---

## Security Findings

### S1. [CRITICAL] All traffic uses plaintext HTTP/WS with no authentication

**Files:** `lib/store.ts:33`, `lib/websocket.ts:22`, `lib/api.ts:33-46`

The app hardcodes `http://` and `ws://` protocols. There is no TLS, no authentication token, no API key. Any device on the same network can:
- Read all session content (source code, file contents, tool outputs)
- Create sessions that execute arbitrary Claude Code commands
- Approve or deny tool use
- Delete sessions and projects

`expo-secure-store` is installed but never used.

**Recommendation:** Add token-based auth. Store API token in `expo-secure-store`. Support `https://` and `wss://`.

---

### S2. [CRITICAL] No input sanitization before sending prompts

**Files:** `app/(tabs)/sessions/[id].tsx:140-147`, `lib/api.ts:110-124`, `components/CreateSessionSheet.tsx:57-76`

User-provided prompts, session names, and project paths are sent with only `.trim()`. The `project_dir` field is particularly dangerous.

**Recommendation:** Validate `project_dir` against the known projects list. Sanitize and length-limit the `name` field.

---

### S3. [HIGH] Server address stored in plaintext AsyncStorage

**File:** `lib/store.ts:60-66`

The Tailscale hostname/IP and port are persisted in unencrypted AsyncStorage despite `expo-secure-store` being installed.

---

### S4. [HIGH] Deep link scheme registered but no route validation

**File:** `app.json:8`

The custom URL scheme `claude-code-remote://` is registered with no validation of deep link parameters.

---

### S5. [HIGH] Push notification token sent over unauthenticated connection

**File:** `lib/notifications.ts:44-47`

The Expo push token is registered over unauthenticated HTTP. An attacker could intercept or register their own token.

---

### S6. [MEDIUM] Sensitive data in app state

**Files:** Various

Session costs, full message history (including file contents), and tool inputs with sensitive data are held in Zustand state in memory with no scrubbing.

---

### S7. [MEDIUM] No WebSocket message validation

**File:** `lib/websocket.ts:30-37`

Incoming WebSocket messages are parsed and cast to `WSMessageData` with no runtime validation. The `data` field is `Record<string, any>`.

---

## Code Quality / Performance Findings

### C1. [HIGH] FlatList uses index as key

**File:** `app/(tabs)/sessions/[id].tsx:111`

```typescript
keyExtractor={(_, i) => String(i)}
```

Causes unnecessary re-renders of every visible cell on each new streaming message.

**Recommendation:** Generate stable unique IDs per message.

---

### C2. [HIGH] Zustand `appendMessage` copies entire message array per append

**File:** `lib/store.ts:37-45`

Every incoming WebSocket message spreads the entire record and array. Significant GC pressure during active sessions.

**Recommendation:** Use Immer middleware or move to a ref-based approach.

---

### C3. [HIGH] Missing React.memo on list item components

**Files:** `components/MessageCard.tsx`, `components/SessionCard.tsx`, `components/AssistantTextCard.tsx`

Not wrapped in `React.memo`, causing all visible cards to re-render on every state change. AssistantTextCard re-parses markdown each time.

---

### C4. [HIGH] WebSocket reconnection has no backoff or max retry

**File:** `lib/websocket.ts:40-45`

Fixed 3-second reconnect delay forever. No exponential backoff, no max retries, no jitter.

**Recommendation:** Implement exponential backoff with jitter (1s, 2s, 4s, ..., max 60s). Add max retry count with a "Reconnect" button.

---

### C5. [MEDIUM] `useSessionStream` subscribes to entire `sessionMessages` object

**File:** `lib/websocket.ts:11`

Returns the entire `sessionMessages` record, re-rendering when *any* session's messages change.

**Recommendation:** Select only the specific session: `s.sessionMessages[sessionId] ?? []`

---

### C6. [MEDIUM] `useBaseUrl()` selector defeats memoization

**File:** `lib/api.ts:29-31`

Calls `getBaseUrl()` inside the selector, returning a new string each time, bypassing Zustand's shallow equality.

---

### C7. [MEDIUM] `useNotificationSetup` has stale closure risk

**File:** `lib/notifications.ts:43-61`

Empty dependency array but references `registerToken` which changes on every render.

---

### C8. [MEDIUM] No error boundary

**File:** `app/_layout.tsx`

No error boundary in the component tree. Malformed WebSocket data or markdown parsing errors crash the entire app.

---

### C9. [MEDIUM] TypeScript type safety gaps

**File:** `lib/types.ts:101`

`data: Record<string, any>` — specific data interfaces are defined but never used (dead code).

**Recommendation:** Use a discriminated union type.

---

### C10. [MEDIUM] `scrollToEnd` uses setTimeout hack

**File:** `app/(tabs)/sessions/[id].tsx:38-42`

100ms setTimeout races against layout. Also fires during historical message loads, scrolling unexpectedly.

**Recommendation:** Use `onContentSizeChange` and only auto-scroll if user is near the bottom.

---

## UX Findings

### U1. [HIGH] No keyboard avoidance on session detail

**File:** `app/(tabs)/sessions/[id].tsx`

Plain `View` container. InputBar is hidden behind keyboard on iOS.

**Recommendation:** Wrap in `KeyboardAvoidingView` with `behavior="padding"`.

---

### U2. [MEDIUM] No offline/disconnected state handling

No mechanism to detect when server is unreachable. No persistent banner shown.

---

### U3. [MEDIUM] No accessibility labels or roles

None of the interactive elements have `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint`.

---

### U4. [LOW] ApprovalCard decision state is local

If user navigates away and back, approval buttons reappear. Could accidentally approve/deny twice.

---

## Architecture Findings

### A1. [MEDIUM] Duplicate session creation UI

`sessions/create.tsx` (full screen) and `CreateSessionSheet.tsx` (bottom sheet) are separate implementations with different feature sets. Maintenance risk.

---

## Summary Table

| ID | Severity | Category | Description |
|----|----------|----------|-------------|
| S1 | CRITICAL | Security | No auth/TLS on any traffic |
| S2 | CRITICAL | Security | No input sanitization |
| S3 | HIGH | Security | Plaintext AsyncStorage for server address |
| S4 | HIGH | Security | Deep link scheme with no validation |
| S5 | HIGH | Security | Push token sent unauthenticated |
| S6 | MEDIUM | Security | Sensitive data in app state |
| S7 | MEDIUM | Security | No WebSocket message validation |
| C1 | HIGH | Performance | FlatList index keys |
| C2 | HIGH | Performance | Full array copy per message append |
| C3 | HIGH | Performance | Missing React.memo on list items |
| C4 | HIGH | Quality | No reconnect backoff |
| C5 | MEDIUM | Performance | Over-broad Zustand selector |
| C6 | MEDIUM | Performance | Selector defeats memoization |
| C7 | MEDIUM | Quality | Stale closure in notification setup |
| C8 | MEDIUM | Quality | No error boundary |
| C9 | MEDIUM | Quality | Record<string, any> type gaps |
| C10 | MEDIUM | Quality | setTimeout scroll hack |
| U1 | HIGH | UX | No keyboard avoidance |
| U2 | MEDIUM | UX | No offline handling |
| U3 | MEDIUM | UX | No accessibility |
| U4 | LOW | UX | Local approval state |
| A1 | MEDIUM | Architecture | Duplicate session creation UI |
