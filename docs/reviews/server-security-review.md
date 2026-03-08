# Server Code & Security Review

## Executive Summary

The CCR server is a well-structured FastAPI application with clear separation of concerns and a reasonable test suite. However, it has several security vulnerabilities that range from critical to medium severity, along with code quality issues around race conditions and resource management.

---

## Security Findings

### S1. [CRITICAL] Hook script fails open when server is unreachable

**File:** `hooks/ccr_approval.py:111-115`

If the CCR server crashes or is unreachable, every tool invocation -- including Bash, Write, and Edit -- is automatically approved. An attacker on the tailnet (or a network disruption) could exploit this to bypass all permission checks.

**Recommendation:** Fail closed by default. Add a configurable `CCR_APPROVAL_FAIL_MODE` env var (defaulting to "deny") that the hook reads. Only fail open when explicitly configured.

---

### S2. [CRITICAL] Internal API endpoints have no authentication

**File:** `routes.py:114-131`

The `/api/internal/approval-request` and `/api/internal/statusline` endpoints are registered on the same router as all other endpoints. When running with `--no-auth`, any process on localhost can call these. When running with Tailscale auth, any device on the tailnet can call them. There is no shared secret or other mechanism to verify that the caller is actually the CCR hook script.

This means any tailnet member (or any local process in `--no-auth` mode) can:
- Auto-approve any pending tool use by calling `/api/internal/approval-request`
- Manipulate session status via `/api/internal/statusline`

**Recommendation:** Add a per-session HMAC token or a server-level shared secret passed via environment to the subprocess, and validate it on the internal endpoints. Alternatively, bind internal endpoints to a separate localhost-only port.

---

### S3. [HIGH] No validation or sanitization of `project_dir`

**File:** `models.py:52`, `session_manager.py:220`

The `project_dir` field from `SessionCreate` is passed directly as the `cwd` argument to `asyncio.create_subprocess_exec`. There is no validation that it:
- Is an absolute path
- Actually exists as a directory
- Does not contain path traversal components (`../`)
- Is within any allowed set of directories

A user can set `project_dir` to `/`, `/etc`, or any sensitive directory.

**Recommendation:** Validate `project_dir` in `SessionCreate` using a Pydantic validator: resolve the path, verify it exists as a directory, and optionally restrict to an allowlist of parent directories.

---

### S4. [HIGH] Session data persisted in plaintext JSON with default permissions

**File:** `session_manager.py:123`

Session JSON files at `~/.local/state/claude-code-remote/sessions/` contain the full `messages` list, which can include tool inputs/outputs, file contents, and potentially secrets. These files are written with default permissions (typically 0644, world-readable).

**Recommendation:** Set restrictive file permissions (0600) when writing session files.

---

### S5. [HIGH] Multiple endpoints accept untyped `body: dict`

**File:** `routes.py:78, 105, 115, 123`

Multiple endpoints accept `body: dict` instead of typed Pydantic models:
- `send_prompt` (line 78)
- `resume_session` (line 105)
- `internal_approval_request` (line 115)
- `internal_statusline` (line 123)

This bypasses Pydantic's validation entirely. Arbitrary keys and values are accepted without type checking or size limits.

**Recommendation:** Define proper Pydantic request models for each endpoint. Add length constraints on string fields.

---

### S6. [HIGH] `skip_permissions` defaults to `True`

**File:** `models.py:57`

When `skip_permissions` is `True`, the session spawns Claude with `--dangerously-skip-permissions`. By default, every session created through the API runs with no permission checks at all.

**Recommendation:** Default `skip_permissions` to `False`. Require explicit opt-in for dangerous mode.

---

### S7. [MEDIUM] WebSocket endpoint may bypass auth middleware

**File:** `websocket.py:20-27`

The WebSocket endpoint at `/ws/sessions/{session_id}` may not go through `TailscaleAuthMiddleware` properly. Starlette's `BaseHTTPMiddleware` has known issues with WebSocket connections. Session IDs are short (12 hex chars), making them guessable.

**Recommendation:** Verify middleware applies to WebSocket upgrades. Consider adding a token-based auth query parameter.

---

### S8. [MEDIUM] Auth middleware uses synchronous `subprocess.run`

**File:** `auth.py:18-23`

`verify_tailscale_client` calls `subprocess.run` synchronously inside an `async def dispatch` method. This blocks the event loop for up to 5 seconds per request.

**Recommendation:** Use `asyncio.create_subprocess_exec` or `asyncio.to_thread()`.

---

### S9. [MEDIUM] No CORS policy configured

**File:** `server.py`

No CORS middleware is configured. If the server is ever exposed beyond Tailscale, any web page could make cross-origin requests.

**Recommendation:** Add `CORSMiddleware` with a restrictive origin policy.

---

### S10. [MEDIUM] Push token not validated

**File:** `push.py:47`, `routes.py:193`

The `expo_push_token` field accepts any string with no format validation.

**Recommendation:** Validate that tokens match the `ExponentPushToken[...]` format.

---

## Code Quality Findings

### Q1. [HIGH] Race condition in session state management

**File:** `session_manager.py`

Multiple async tasks (output reader, stderr reader, API requests) concurrently mutate the same Session object's status, messages, and other fields. There is no `asyncio.Lock` protecting these mutations.

**Recommendation:** Add a per-session `asyncio.Lock` around all state mutations and process lifecycle operations.

---

### Q2. [HIGH] Fire-and-forget tasks created without tracking

**File:** `session_manager.py:248-249`

```python
asyncio.create_task(self._read_output(session_id, proc))
asyncio.create_task(self._read_stderr(session_id, proc))
```

These tasks are never stored or awaited. Unhandled exceptions are silently swallowed. On shutdown, reader tasks are never awaited.

**Recommendation:** Store task references. Await them during shutdown.

---

### Q3. [MEDIUM] Unbounded message accumulation

**File:** `session_manager.py:281`

Every event from Claude is appended to `session.messages` and never trimmed. Long-running sessions can produce multi-gigabyte JSON files.

**Recommendation:** Add a configurable message limit or archive older messages to disk.

---

### Q4. [MEDIUM] No cleanup of old sessions

**File:** `session_manager.py:125`

`load_sessions` loads every JSON file into memory. Over time, completed/errored sessions accumulate indefinitely.

**Recommendation:** Implement session expiry or don't load completed sessions into memory by default.

---

### Q5. [MEDIUM] `_stop_process` only sends SIGTERM, no SIGKILL fallback

**File:** `session_manager.py:139-145`

If the Claude subprocess ignores SIGTERM, it becomes a zombie. No timeout-based SIGKILL escalation.

**Recommendation:** After `terminate()`, wait with a timeout, then `kill()` if needed. Make `_stop_process` async.

---

### Q6. [MEDIUM] Subscriber list not cleaned up on broadcast failure

**File:** `session_manager.py:494-502`

Failed subscribers are caught but never removed, leading to stale callback accumulation.

---

### Q7. [MEDIUM] `register_project` mutates shared list, not persisted

**File:** `routes.py:166-171`

`scan_dirs.append()` is not persisted and has no deduplication.

---

### Q8. [LOW] Deprecated `asyncio.get_event_loop()` usage

**File:** `session_manager.py:437`

Should use `asyncio.get_running_loop()` instead.

---

### Q9. [LOW] Sensitive data logged at INFO level

**File:** `session_manager.py:212-213, 270`

Full command lines and first 200 chars of stdout are logged at INFO level. Claude's output may contain sensitive code or PII.

---

### Q10. [LOW] Context percent calculation overwrites across models

**File:** `session_manager.py:309-321`

If multiple models are used, only the last model's context percentage is kept.

---

## Summary Table

| ID | Severity | Category | Description |
|----|----------|----------|-------------|
| S1 | CRITICAL | Security | Hook fails open when server unreachable |
| S2 | CRITICAL | Security | Internal endpoints have no auth |
| S3 | HIGH | Security | No validation on project_dir |
| S4 | HIGH | Security | Session files world-readable |
| S5 | HIGH | Security | Untyped dict bodies bypass validation |
| S6 | HIGH | Security | skip_permissions defaults to True |
| S7 | MEDIUM | Security | WebSocket auth may not apply |
| S8 | MEDIUM | Security | Sync subprocess blocks event loop |
| S9 | MEDIUM | Security | No CORS policy |
| S10 | MEDIUM | Security | Push token not validated |
| Q1 | HIGH | Quality | No locking on concurrent state mutations |
| Q2 | HIGH | Quality | Untracked fire-and-forget tasks |
| Q3 | MEDIUM | Quality | Unbounded message list growth |
| Q4 | MEDIUM | Quality | No cleanup of old sessions |
| Q5 | MEDIUM | Quality | No SIGKILL fallback on stop |
| Q6 | MEDIUM | Quality | Stale subscribers not cleaned |
| Q7 | MEDIUM | Quality | scan_dirs mutation not persisted |
| Q8 | LOW | Quality | Deprecated get_event_loop() |
| Q9 | LOW | Quality | Sensitive data in logs |
| Q10 | LOW | Quality | Context percent overwrites across models |
