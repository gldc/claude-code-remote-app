# Layer 0: Server Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 11 new server modules/extensions that all 15 features depend on.

**Architecture:** Each module is a standalone Python file with its own Pydantic models, persisted to the existing `~/.local/state/claude-code-remote/` directory. New REST endpoints are registered in `routes.py`. All modules follow the existing patterns: async functions, Pydantic models, JSON persistence.

**Tech Stack:** Python 3.10+, FastAPI, Pydantic v2, asyncio, httpx

**Repos:**
- Server: `/Users/gldc/Developer/claude-code-remote`
- Key files: `src/claude_code_remote/models.py` (223 lines), `routes.py` (202 lines), `session_manager.py` (526 lines), `server.py` (89 lines), `config.py` (41 lines)

---

## Task 1: OAuth Usage Client (`usage.py`)

**Files:**
- Create: `src/claude_code_remote/usage.py`
- Modify: `src/claude_code_remote/models.py` (add UsageData models after line 222)
- Modify: `src/claude_code_remote/routes.py` (add usage endpoints)
- Modify: `src/claude_code_remote/server.py` (wire UsageClient into app)
- Modify: `src/claude_code_remote/config.py` (add USAGE_HISTORY_FILE path)
- Test: `tests/test_usage.py`

**Step 1: Add models to `models.py`**

Append after line 222:

```python
class UsageWindow(BaseModel):
    percent_remaining: float = 0.0
    resets_in_seconds: int = 0

class UsageWindowWithReserve(UsageWindow):
    reserve_percent: float = 0.0

class ExtraUsage(BaseModel):
    monthly_spend: float = 0.0
    monthly_limit: float = 0.0

class UsageData(BaseModel):
    session: UsageWindow = Field(default_factory=UsageWindow)
    weekly: UsageWindowWithReserve = Field(default_factory=UsageWindowWithReserve)
    sonnet: UsageWindow = Field(default_factory=UsageWindow)
    extra_usage: ExtraUsage = Field(default_factory=ExtraUsage)
    plan_tier: str = "unknown"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

**Step 2: Add path to `config.py`**

After the `PUSH_FILE` line, add:

```python
USAGE_HISTORY_FILE = STATE_DIR / "usage_history.jsonl"
```

**Step 3: Create `usage.py`**

```python
"""OAuth-based usage client for Claude Max plan."""

import asyncio
import json
import logging
import time
from pathlib import Path

import httpx

from .models import UsageData, UsageWindow, UsageWindowWithReserve, ExtraUsage

logger = logging.getLogger(__name__)

USAGE_API_URL = "https://api.anthropic.com/api/oauth/usage"
ANTHROPIC_BETA = "oauth-2025-04-20"
CACHE_TTL_SECONDS = 60

# Credential locations
KEYCHAIN_SERVICE = "Claude Code-credentials"
CREDENTIALS_FILE = Path.home() / ".claude" / ".credentials.json"


def _read_credentials_file() -> str | None:
    """Read OAuth token from credentials file."""
    try:
        if CREDENTIALS_FILE.exists():
            data = json.loads(CREDENTIALS_FILE.read_text())
            return data.get("access_token") or data.get("token")
    except Exception as e:
        logger.debug("Failed to read credentials file: %s", e)
    return None


def _read_keychain() -> str | None:
    """Read OAuth token from macOS Keychain."""
    import subprocess
    try:
        result = subprocess.run(
            ["security", "find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            # Keychain may store JSON or raw token
            raw = result.stdout.strip()
            try:
                data = json.loads(raw)
                return data.get("access_token") or data.get("token") or raw
            except json.JSONDecodeError:
                return raw
    except Exception as e:
        logger.debug("Failed to read keychain: %s", e)
    return None


def get_oauth_token() -> str | None:
    """Get OAuth token from keychain (preferred) or credentials file."""
    return _read_keychain() or _read_credentials_file()


class UsageClient:
    """Polls Anthropic OAuth usage API and caches results."""

    def __init__(self, history_file: Path):
        self.history_file = history_file
        self._cache: UsageData | None = None
        self._cache_time: float = 0

    async def get_usage(self) -> UsageData:
        """Get current usage data, from cache if fresh."""
        now = time.time()
        if self._cache and (now - self._cache_time) < CACHE_TTL_SECONDS:
            return self._cache

        token = await asyncio.to_thread(get_oauth_token)
        if not token:
            logger.warning("No OAuth token found for usage API")
            return self._cache or UsageData()

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    USAGE_API_URL,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "anthropic-beta": ANTHROPIC_BETA,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception as e:
            logger.error("Usage API request failed: %s", e)
            return self._cache or UsageData()

        usage = self._parse_usage(data)
        self._cache = usage
        self._cache_time = now

        # Append to history
        await self._append_history(usage)

        return usage

    def _parse_usage(self, data: dict) -> UsageData:
        """Parse Anthropic usage API response."""
        usage = UsageData()

        if "five_hour" in data:
            fh = data["five_hour"]
            usage.session = UsageWindow(
                percent_remaining=fh.get("percent_remaining", 0),
                resets_in_seconds=fh.get("resets_in_seconds", 0),
            )

        if "seven_day" in data:
            sd = data["seven_day"]
            usage.weekly = UsageWindowWithReserve(
                percent_remaining=sd.get("percent_remaining", 0),
                reserve_percent=sd.get("reserve_percent", 0),
                resets_in_seconds=sd.get("resets_in_seconds", 0),
            )

        # Sonnet-specific weekly (may be under seven_day_sonnet or similar)
        for key in ("seven_day_sonnet", "sonnet"):
            if key in data:
                s = data[key]
                usage.sonnet = UsageWindow(
                    percent_remaining=s.get("percent_remaining", 0),
                    resets_in_seconds=s.get("resets_in_seconds", 0),
                )
                break

        if "extra_usage" in data:
            eu = data["extra_usage"]
            usage.extra_usage = ExtraUsage(
                monthly_spend=eu.get("monthly_spend", 0),
                monthly_limit=eu.get("monthly_limit", 0),
            )

        usage.plan_tier = data.get("rate_limit_tier", data.get("plan", "unknown"))
        return usage

    async def _append_history(self, usage: UsageData) -> None:
        """Append usage snapshot to JSONL history file."""
        try:
            line = usage.model_dump_json() + "\n"
            await asyncio.to_thread(
                lambda: self.history_file.open("a").write(line)
            )
        except Exception as e:
            logger.debug("Failed to write usage history: %s", e)

    async def get_history(self, days: int = 7) -> list[UsageData]:
        """Read usage history from JSONL file, filtered to last N days."""
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        results = []
        try:
            if not self.history_file.exists():
                return results
            text = await asyncio.to_thread(self.history_file.read_text)
            for line in text.strip().split("\n"):
                if not line:
                    continue
                try:
                    entry = UsageData.model_validate_json(line)
                    if entry.updated_at >= cutoff:
                        results.append(entry)
                except Exception:
                    continue
        except Exception as e:
            logger.debug("Failed to read usage history: %s", e)
        return results
```

**Step 4: Add import at top of `usage.py`**

```python
from datetime import datetime, timezone
```

**Step 5: Wire into `server.py`**

After `push_mgr = PushManager(PUSH_FILE)` (around line 44), add:

```python
from .usage import UsageClient
from .config import USAGE_HISTORY_FILE
usage_client = UsageClient(USAGE_HISTORY_FILE)
```

Pass `usage_client` to `create_router()`. Add `app.state.usage_client = usage_client`.

**Step 6: Add endpoints to `routes.py`**

Update `create_router` signature to accept `usage_client`. Add:

```python
@router.get("/usage")
async def get_usage():
    return await usage_client.get_usage()

@router.get("/usage/history")
async def get_usage_history(days: int = 7):
    return await usage_client.get_history(days)
```

**Step 7: Write test `tests/test_usage.py`**

```python
import pytest
from unittest.mock import patch, AsyncMock
from claude_code_remote.usage import UsageClient, get_oauth_token
from claude_code_remote.models import UsageData

@pytest.fixture
def usage_client(tmp_path):
    return UsageClient(tmp_path / "history.jsonl")

def test_get_oauth_token_file(tmp_path, monkeypatch):
    creds = tmp_path / "creds.json"
    creds.write_text('{"access_token": "test-token"}')
    monkeypatch.setattr("claude_code_remote.usage.CREDENTIALS_FILE", creds)
    monkeypatch.setattr("claude_code_remote.usage._read_keychain", lambda: None)
    assert get_oauth_token() == "test-token"

def test_parse_usage(usage_client):
    data = {
        "five_hour": {"percent_remaining": 97, "resets_in_seconds": 10500},
        "seven_day": {"percent_remaining": 88, "reserve_percent": 7, "resets_in_seconds": 460500},
        "seven_day_sonnet": {"percent_remaining": 93, "resets_in_seconds": 46500},
        "extra_usage": {"monthly_spend": 0, "monthly_limit": 50},
        "rate_limit_tier": "Max",
    }
    usage = usage_client._parse_usage(data)
    assert usage.session.percent_remaining == 97
    assert usage.weekly.reserve_percent == 7
    assert usage.sonnet.percent_remaining == 93
    assert usage.plan_tier == "Max"

@pytest.mark.asyncio
async def test_cache_ttl(usage_client):
    """Second call within TTL returns cached data."""
    mock_data = {"five_hour": {"percent_remaining": 50, "resets_in_seconds": 100}}
    with patch("claude_code_remote.usage.get_oauth_token", return_value="tok"):
        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value.json.return_value = mock_data
            mock_get.return_value.raise_for_status = lambda: None
            r1 = await usage_client.get_usage()
            r2 = await usage_client.get_usage()
            assert mock_get.call_count == 1  # Cached
            assert r1.session.percent_remaining == 50
```

**Step 8: Run tests**

```bash
cd /Users/gldc/Developer/claude-code-remote
python -m pytest tests/test_usage.py -v
```

**Step 9: Commit**

```bash
git add src/claude_code_remote/usage.py src/claude_code_remote/models.py src/claude_code_remote/routes.py src/claude_code_remote/server.py src/claude_code_remote/config.py tests/test_usage.py
git commit -m "feat: add OAuth usage client for Max plan quota tracking"
```

---

## Task 2: Git Operations Service (`git.py`)

**Files:**
- Create: `src/claude_code_remote/git.py`
- Modify: `src/claude_code_remote/models.py` (add git models)
- Modify: `src/claude_code_remote/routes.py` (add git endpoints)
- Test: `tests/test_git.py`

**Step 1: Add models to `models.py`**

```python
class GitFileStatus(BaseModel):
    path: str
    status: str  # "M", "A", "D", "?", "R"

class GitStatus(BaseModel):
    branch: str = ""
    modified: list[GitFileStatus] = Field(default_factory=list)
    staged: list[GitFileStatus] = Field(default_factory=list)
    untracked: list[str] = Field(default_factory=list)
    counts: dict[str, int] = Field(default_factory=dict)

class GitBranch(BaseModel):
    name: str
    is_current: bool = False

class GitLogEntry(BaseModel):
    hash: str
    message: str
    author: str
    date: str
```

**Step 2: Create `git.py`**

```python
"""Git operations for session project directories."""

import asyncio
import logging

from .models import GitStatus, GitFileStatus, GitBranch, GitLogEntry

logger = logging.getLogger(__name__)


async def _run_git(project_dir: str, *args: str, timeout: float = 10) -> str:
    """Run a git command and return stdout."""
    proc = await asyncio.create_subprocess_exec(
        "git", "-C", project_dir, *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        raise TimeoutError(f"git {args[0]} timed out after {timeout}s")
    if proc.returncode != 0:
        raise RuntimeError(f"git {args[0]} failed: {stderr.decode().strip()}")
    return stdout.decode().strip()


async def git_status(project_dir: str) -> GitStatus:
    """Get git status for a project directory."""
    branch = await _run_git(project_dir, "branch", "--show-current")
    raw = await _run_git(project_dir, "status", "--porcelain=v1")

    modified, staged, untracked = [], [], []
    for line in raw.split("\n"):
        if not line:
            continue
        index_status = line[0]
        work_status = line[1]
        filepath = line[3:]

        if index_status == "?":
            untracked.append(filepath)
        elif index_status != " ":
            staged.append(GitFileStatus(path=filepath, status=index_status))
        if work_status not in (" ", "?"):
            modified.append(GitFileStatus(path=filepath, status=work_status))

    return GitStatus(
        branch=branch,
        modified=modified,
        staged=staged,
        untracked=untracked,
        counts={
            "modified": len(modified),
            "staged": len(staged),
            "untracked": len(untracked),
        },
    )


async def git_diff(project_dir: str, file: str | None = None) -> str:
    """Get unified diff output."""
    args = ["diff"]
    if file:
        args.extend(["--", file])
    return await _run_git(project_dir, *args)


async def git_branches(project_dir: str) -> list[GitBranch]:
    """List all branches with current marked."""
    raw = await _run_git(project_dir, "branch", "--format=%(refname:short)|%(HEAD)")
    branches = []
    for line in raw.split("\n"):
        if not line or "|" not in line:
            continue
        name, head = line.split("|", 1)
        branches.append(GitBranch(name=name.strip(), is_current=head.strip() == "*"))
    return branches


async def git_log(project_dir: str, n: int = 10) -> list[GitLogEntry]:
    """Get recent commit log."""
    fmt = "%H|%s|%an|%ci"
    raw = await _run_git(project_dir, "log", f"-{n}", f"--format={fmt}")
    entries = []
    for line in raw.split("\n"):
        if not line:
            continue
        parts = line.split("|", 3)
        if len(parts) == 4:
            entries.append(GitLogEntry(hash=parts[0], message=parts[1], author=parts[2], date=parts[3]))
    return entries
```

**Step 3: Add endpoints to `routes.py`**

```python
from .git import git_status, git_diff, git_branches, git_log

@router.get("/sessions/{session_id}/git/status")
async def get_git_status(session_id: str):
    session = session_mgr.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404)
    return await git_status(session.project_dir)

@router.get("/sessions/{session_id}/git/diff")
async def get_git_diff(session_id: str, file: str | None = None):
    session = session_mgr.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404)
    return {"diff": await git_diff(session.project_dir, file)}

@router.get("/sessions/{session_id}/git/branches")
async def get_git_branches(session_id: str):
    session = session_mgr.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404)
    return await git_branches(session.project_dir)

@router.get("/sessions/{session_id}/git/log")
async def get_git_log(session_id: str, n: int = 10):
    session = session_mgr.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404)
    return await git_log(session.project_dir, n)
```

**Step 4: Write tests, run, commit**

Test file should cover: `_run_git` with a real git repo (use `tmp_path` + `git init`), status parsing, branch listing, log parsing. Use `pytest.mark.asyncio`.

```bash
git commit -m "feat: add git operations service with status/diff/branch/log endpoints"
```

---

## Task 3: Enhanced Stream Event Parsing

**Files:**
- Modify: `src/claude_code_remote/models.py` (add WSMessageType entries)
- Modify: `src/claude_code_remote/session_manager.py` (extend `_parse_event`)
- Test: `tests/test_session_manager.py` (add parse_event tests)

**Step 1: Add new WSMessageType entries**

In `models.py`, add to WSMessageType enum (after line 44):

```python
    TOOL_RESULT = "tool_result"  # already exists — keep
    BASH_OUTPUT = "bash_output"  # new
```

Note: `TOOL_RESULT` already exists. Just add `BASH_OUTPUT`.

**Step 2: Extend `_parse_event` in `session_manager.py`**

Currently (lines 362-409) handles: assistant, result, rate_limit_event. Add handling between result and rate_limit_event:

After the assistant content block loop (around line 390), add tool_result detection. The assistant event content blocks can include `tool_result` type — but tool results typically come as separate events. Check the actual event type:

```python
# After existing "result" handling (line 401), before "rate_limit_event" (line 403):

if event_type == "tool_result":
    content = event.get("content", "")
    tool_use_id = event.get("tool_use_id", "")
    is_error = event.get("is_error", False)

    # Detect if content is a diff
    content_type = "text"
    if isinstance(content, str) and (
        content.startswith("diff --git") or content.startswith("---")
    ):
        content_type = "diff"

    return WSMessage(
        type=WSMessageType.TOOL_RESULT,
        data={
            "tool_use_id": tool_use_id,
            "content": content,
            "content_type": content_type,
            "is_error": is_error,
        },
    )
```

Add bash output detection — when a tool_result comes from a Bash tool and contains ANSI codes:

```python
# Inside the existing tool_result handling, or as a separate check:
# If the tool name was Bash and output contains ANSI escape codes, emit BASH_OUTPUT
```

Actually, the simpler approach: the server already emits `TOOL_RESULT` via the existing `tool_result` in `_parse_event`. We need to enrich what's captured. The key change is detecting content type (diff, code, bash) and preserving ANSI.

**Step 3: Add `cache_read_tokens` and `cache_write_tokens` to Session model**

In `models.py`, add to Session (after `context_percent`):

```python
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0
```

In `session_manager.py` where modelUsage is parsed (around line 315-320), also capture:

```python
session.cache_read_tokens = usage.get("cacheReadInputTokens", 0)
session.cache_write_tokens = usage.get("cacheCreationInputTokens", 0)
```

**Step 4: Run tests, commit**

```bash
git commit -m "feat: enhance stream event parsing with content type detection and cache tokens"
```

---

## Task 4: Search & Export

**Files:**
- Modify: `src/claude_code_remote/session_manager.py` (add search_sessions, export_session)
- Modify: `src/claude_code_remote/routes.py` (add endpoints)
- Test: `tests/test_session_manager.py` (add search tests)

**Step 1: Add methods to `SessionManager`**

```python
def search_sessions(self, query: str) -> list[dict]:
    """Full-text search across session messages."""
    query_lower = query.lower()
    results = []
    for sid, session in self.sessions.items():
        for msg in session.messages:
            text = ""
            data = msg.get("data", {})
            if msg.get("type") == "assistant_text":
                text = data.get("text", "")
            elif msg.get("type") == "user_message":
                text = data.get("text", "")
            elif msg.get("type") == "tool_result":
                text = str(data.get("output", ""))

            if query_lower in text.lower():
                # Extract snippet around match
                idx = text.lower().index(query_lower)
                start = max(0, idx - 50)
                end = min(len(text), idx + len(query) + 50)
                snippet = text[start:end]
                results.append({
                    "session_id": sid,
                    "session_name": session.name,
                    "snippet": snippet,
                    "message_type": msg.get("type"),
                    "timestamp": msg.get("timestamp"),
                })
                break  # One match per session is enough for listing
    return results

def export_session(self, session_id: str) -> dict | None:
    """Export full session data as dict."""
    session = self.sessions.get(session_id)
    if not session:
        return None
    return session.model_dump(mode="json")
```

**Step 2: Add endpoints**

```python
@router.get("/sessions/search")
async def search_sessions(q: str = ""):
    if not q or len(q) < 2:
        raise HTTPException(400, "Query must be at least 2 characters")
    return session_mgr.search_sessions(q)

@router.get("/sessions/{session_id}/export")
async def export_session(session_id: str):
    data = session_mgr.export_session(session_id)
    if not data:
        raise HTTPException(404)
    return data
```

**Important**: The search endpoint must be registered BEFORE the `/{session_id}` catch-all route to avoid "search" being interpreted as a session ID.

**Step 3: Test and commit**

```bash
git commit -m "feat: add session search and export endpoints"
```

---

## Task 5: Approval Rules Engine (`approval_rules.py`)

**Files:**
- Create: `src/claude_code_remote/approval_rules.py`
- Modify: `src/claude_code_remote/models.py` (add ApprovalRule model)
- Modify: `src/claude_code_remote/routes.py` (add rule endpoints)
- Modify: `src/claude_code_remote/hooks/ccr_approval.py` (check rules before routing)
- Modify: `src/claude_code_remote/config.py` (add APPROVAL_RULES_FILE)
- Test: `tests/test_approval_rules.py`

**Step 1: Add model**

```python
class ApprovalRule(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    tool_pattern: str  # exact name or glob pattern like "Bash*"
    action: str = "approve"  # "approve" or "deny"
    project_dir: str | None = None  # scope to project, or None for global
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

**Step 2: Create `approval_rules.py`**

```python
"""Approval rules engine — auto-approve/deny tools based on saved rules."""

import fnmatch
import json
import logging
from pathlib import Path

from .models import ApprovalRule

logger = logging.getLogger(__name__)


class ApprovalRulesStore:
    def __init__(self, rules_file: Path):
        self.rules_file = rules_file
        self.rules: dict[str, ApprovalRule] = {}
        self._load()

    def _load(self) -> None:
        try:
            if self.rules_file.exists():
                data = json.loads(self.rules_file.read_text())
                for item in data:
                    rule = ApprovalRule.model_validate(item)
                    self.rules[rule.id] = rule
        except Exception as e:
            logger.warning("Failed to load approval rules: %s", e)

    def _save(self) -> None:
        self.rules_file.parent.mkdir(parents=True, exist_ok=True)
        data = [r.model_dump(mode="json") for r in self.rules.values()]
        self.rules_file.write_text(json.dumps(data, indent=2))

    def create(self, tool_pattern: str, action: str = "approve", project_dir: str | None = None) -> ApprovalRule:
        rule = ApprovalRule(tool_pattern=tool_pattern, action=action, project_dir=project_dir)
        self.rules[rule.id] = rule
        self._save()
        return rule

    def delete(self, rule_id: str) -> bool:
        if rule_id in self.rules:
            del self.rules[rule_id]
            self._save()
            return True
        return False

    def list(self) -> list[ApprovalRule]:
        return list(self.rules.values())

    def check(self, tool_name: str, project_dir: str | None = None) -> ApprovalRule | None:
        """Find first matching rule for a tool invocation."""
        for rule in self.rules.values():
            if not fnmatch.fnmatch(tool_name, rule.tool_pattern):
                continue
            if rule.project_dir and project_dir and rule.project_dir != project_dir:
                continue
            return rule
        return None
```

**Step 3: Add config path, wire into server, add endpoints, update hook**

The hook (`ccr_approval.py`) should call a new endpoint `GET /api/approval-rules/check?tool=...&project_dir=...` before routing to mobile. Or simpler: the hook can load rules from the same JSON file directly (it runs on the same machine).

Add to hook before the POST to approval-request:

```python
# Check approval rules file
RULES_FILE = Path.home() / ".local" / "state" / "claude-code-remote" / "approval_rules.json"
if RULES_FILE.exists():
    import fnmatch
    rules = json.loads(RULES_FILE.read_text())
    for rule in rules:
        if fnmatch.fnmatch(tool_name, rule.get("tool_pattern", "")):
            proj = rule.get("project_dir")
            if proj and proj != os.environ.get("CCR_PROJECT_DIR", ""):
                continue
            if rule.get("action") == "approve":
                allow()
            else:
                deny(f"Denied by rule: {rule.get('tool_pattern')}")
```

**Step 4: Test and commit**

```bash
git commit -m "feat: add approval rules engine with auto-approve/deny"
```

---

## Task 6: MCP Config Management (`mcp.py`)

**Files:**
- Create: `src/claude_code_remote/mcp.py`
- Modify: `src/claude_code_remote/models.py` (add MCPServer model)
- Modify: `src/claude_code_remote/routes.py` (add MCP endpoints)
- Test: `tests/test_mcp.py`

**Step 1: Add model**

```python
class MCPServer(BaseModel):
    name: str
    type: str = "stdio"  # "stdio" or "sse"
    command: str | None = None  # for stdio
    args: list[str] = Field(default_factory=list)
    url: str | None = None  # for sse
    env: dict[str, str] = Field(default_factory=dict)
    scope: str = "global"  # "global" or "project"

class MCPHealthResult(BaseModel):
    name: str
    healthy: bool
    latency_ms: int | None = None
    error: str | None = None
```

**Step 2: Create `mcp.py`**

Read/write `~/.claude/.mcp.json` (global) and `{project_dir}/.mcp.json` (per-project). Parse the `mcpServers` key. Health check by attempting to spawn/connect.

**Step 3: Add endpoints, test, commit**

```bash
git commit -m "feat: add MCP server config management with health checks"
```

---

## Task 7: Skill Discovery

**Files:**
- Modify: `src/claude_code_remote/routes.py` (add skill endpoint)
- Test: `tests/test_routes.py` (add skill test)

**Step 1: Add endpoint**

```python
import shutil

_skills_cache: dict = {"data": None, "time": 0}
SKILLS_CACHE_TTL = 300  # 5 minutes

@router.get("/skills")
async def list_skills():
    import time
    now = time.time()
    if _skills_cache["data"] and (now - _skills_cache["time"]) < SKILLS_CACHE_TTL:
        return _skills_cache["data"]

    claude_bin = shutil.which("claude")
    if not claude_bin:
        return []

    try:
        proc = await asyncio.create_subprocess_exec(
            claude_bin, "--print-skills",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=10)
        # Parse the output — format TBD based on Claude CLI output
        skills = _parse_skills_output(stdout.decode())
        _skills_cache["data"] = skills
        _skills_cache["time"] = now
        return skills
    except Exception as e:
        logger.error("Failed to discover skills: %s", e)
        return []
```

If `--print-skills` doesn't exist, fall back to a static list of known skills.

**Step 2: Commit**

```bash
git commit -m "feat: add skill discovery endpoint"
```

---

## Task 8: Session Config Extensions

**Files:**
- Modify: `src/claude_code_remote/models.py` (already has `model` field)
- Modify: `src/claude_code_remote/session_manager.py` (pass `--allowedTools` flag)

**Step 1: Verify models**

`SessionCreate` already has `model: str | None = None`. Need to add `allowed_tools`:

```python
    allowed_tools: list[str] | None = None
```

**Step 2: Update `send_prompt`**

In `session_manager.py` around line 175, where `--allowedTools` is set, check if `session.allowed_tools` is set and use it instead of the hardcoded default:

```python
if session.allowed_tools:
    cmd.extend(["--allowedTools", ",".join(session.allowed_tools)])
elif not session.skip_permissions:
    cmd.extend(["--allowedTools", "Read,Write,Edit,..."])  # existing default
```

Also persist `allowed_tools` on the Session model.

**Step 3: Commit**

```bash
git commit -m "feat: support allowed_tools and model override in session config"
```

---

## Task 9: Template Enhancements

**Files:**
- Modify: `src/claude_code_remote/models.py` (add fields to Template)
- Modify: `src/claude_code_remote/templates.py` (seed built-in templates)
- Modify: `src/claude_code_remote/routes.py` (tag filter)

**Step 1: Add fields to Template and TemplateCreate**

```python
class TemplateCreate(BaseModel):
    # ... existing fields ...
    tags: list[str] = Field(default_factory=list)

class Template(TemplateCreate):
    # ... existing fields ...
    is_builtin: bool = False
```

**Step 2: Seed built-in templates in `TemplateStore.__init__`**

```python
BUILTIN_TEMPLATES = [
    Template(id="builtin-review", name="Code Review", initial_prompt="Review the recent changes...", tags=["review"], is_builtin=True),
    Template(id="builtin-tests", name="Test Generation", initial_prompt="Generate tests for...", tags=["testing"], is_builtin=True),
    Template(id="builtin-docs", name="Documentation", initial_prompt="Document the...", tags=["docs"], is_builtin=True),
    Template(id="builtin-refactor", name="Refactor", initial_prompt="Refactor...", tags=["refactor"], is_builtin=True),
    Template(id="builtin-bugfix", name="Bug Fix", initial_prompt="Fix the bug in...", tags=["bugfix"], is_builtin=True),
    Template(id="builtin-security", name="Security Audit", initial_prompt="Audit for security...", tags=["security"], is_builtin=True),
]
```

On init, add built-ins to templates dict if not already present.

**Step 3: Add tag filter to GET /api/templates**

```python
@router.get("/templates")
async def list_templates(tag: str | None = None):
    templates = template_store.list()
    if tag:
        templates = [t for t in templates if tag in t.tags]
    return templates
```

**Step 4: Commit**

```bash
git commit -m "feat: add template presets with tags and built-in seeding"
```

---

## Task 10: Workflow Orchestration (`workflows.py`)

**Files:**
- Create: `src/claude_code_remote/workflows.py`
- Modify: `src/claude_code_remote/models.py` (add Workflow models)
- Modify: `src/claude_code_remote/routes.py` (add workflow endpoints)
- Modify: `src/claude_code_remote/config.py` (add WORKFLOW_DIR)
- Test: `tests/test_workflows.py`

**Step 1: Add models**

```python
class WorkflowStepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"

class WorkflowStep(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    session_config: SessionCreate
    depends_on: list[str] = Field(default_factory=list)  # step IDs
    status: WorkflowStepStatus = WorkflowStepStatus.PENDING
    session_id: str | None = None  # created session ID

class WorkflowStatus(str, Enum):
    CREATED = "created"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"

class Workflow(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    name: str
    steps: list[WorkflowStep] = Field(default_factory=list)
    status: WorkflowStatus = WorkflowStatus.CREATED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

**Step 2: Create `workflows.py`**

Workflow engine: persist workflows as JSON, execute by topological sort, spawn sessions via SessionManager, track step status.

**Step 3: Add endpoints**

- `GET /api/workflows` — list all
- `POST /api/workflows` — create
- `GET /api/workflows/{id}` — get with step status
- `DELETE /api/workflows/{id}` — delete
- `POST /api/workflows/{id}/run` — execute

**Step 4: Test and commit**

```bash
git commit -m "feat: add workflow orchestration with parallel session execution"
```

---

## Task 11: Session Collaboration

**Files:**
- Modify: `src/claude_code_remote/models.py` (extend Session)
- Modify: `src/claude_code_remote/routes.py` (add collaborator endpoints)
- Modify: `src/claude_code_remote/auth.py` (check collaborator access)

**Step 1: Add fields to Session**

```python
    owner: str | None = None
    collaborators: list[str] = Field(default_factory=list)
    require_multi_approval: bool = False
```

**Step 2: Add collaborator model and endpoints**

```python
class CollaboratorRequest(BaseModel):
    identity: str

@router.post("/sessions/{session_id}/collaborators")
async def add_collaborator(session_id: str, body: CollaboratorRequest):
    session = session_mgr.get_session(session_id)
    if not session:
        raise HTTPException(404)
    if body.identity not in session.collaborators:
        session.collaborators.append(body.identity)
        session_mgr.persist_session(session_id)
    return {"collaborators": session.collaborators}

@router.delete("/sessions/{session_id}/collaborators/{identity}")
async def remove_collaborator(session_id: str, identity: str):
    session = session_mgr.get_session(session_id)
    if not session:
        raise HTTPException(404)
    session.collaborators = [c for c in session.collaborators if c != identity]
    session_mgr.persist_session(session_id)
    return {"collaborators": session.collaborators}
```

**Step 3: Set owner on session creation**

In `create_session`, if auth middleware provides Tailscale identity, set `session.owner`.

**Step 4: Commit**

```bash
git commit -m "feat: add session collaboration with owner and collaborator management"
```

---

## Execution Order

Tasks 1-11 should be executed sequentially since they modify shared files (`models.py`, `routes.py`). However, tasks can be parallelized in groups that don't share files:

- **Group A** (parallel): Task 1 (usage.py), Task 2 (git.py), Task 6 (mcp.py)
- **Group B** (after A merges): Task 3 (stream parsing), Task 4 (search), Task 5 (approval rules)
- **Group C** (after B merges): Task 7 (skills), Task 8 (session config), Task 9 (templates)
- **Group D** (after C merges): Task 10 (workflows), Task 11 (collaboration)

Each group's tasks touch different new files but share `models.py` and `routes.py`, so within each group, assign models.py additions to the first agent and have others append after.
