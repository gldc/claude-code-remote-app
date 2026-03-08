# Feature Batch Design — All 15 Features (Max Plan)

## Context

Claude Code Remote has a working server + Expo app with session management, tool approval, streaming, and dark theme. This design adds all 15 features from the feature exploration review, adapted for Claude Max plan users (quota meters instead of API cost focus).

## Architecture: Layer-First

Build in horizontal layers to maximize reuse and parallelism:

- **Layer 0**: Server foundation — new modules, endpoints, models
- **Layer 1**: App foundation — 14 reusable components
- **Layer 2**: Feature screens — 10 parallel agent groups

---

## Layer 0: Server Foundation

### 2a. OAuth Usage Client

**New module**: `src/claude_code_remote/usage.py`

- Read Claude Code OAuth credentials from macOS Keychain (`Claude Code-credentials`) or `~/.claude/.credentials.json`
- Call `GET https://api.anthropic.com/api/oauth/usage` with `Authorization: Bearer <token>`, `anthropic-beta: oauth-2025-04-20`
- Parse into `UsageData` model:
  - `session: { percent_remaining, resets_in_seconds }`
  - `weekly: { percent_remaining, reserve_percent, resets_in_seconds }`
  - `sonnet: { percent_remaining, resets_in_seconds }`
  - `extra_usage: { monthly_spend, monthly_limit }`
  - `plan_tier: str` (Max/Pro/Team)
- Cache with 60s TTL
- Store snapshots to `~/.local/state/claude-code-remote/usage_history.jsonl` (append-only, one JSON line per poll)
- Endpoints: `GET /api/usage`, `GET /api/usage/history?days=7`

**Used by**: Features 1, 7

### 2b. Git Operations Service

**New module**: `src/claude_code_remote/git.py`

Functions (all take `project_dir`):
- `git_status()` → `{ modified: [], staged: [], untracked: [], counts: { modified, staged, untracked } }`
- `git_diff(file?)` → unified diff string (full or per-file)
- `git_branch_list()` → `{ current, branches: [] }`
- `git_log(n=10)` → `[{ hash, message, author, date }]`

All use `asyncio.create_subprocess_exec` with timeout.

Endpoints:
- `GET /api/sessions/{id}/git/status`
- `GET /api/sessions/{id}/git/diff?file=...`
- `GET /api/sessions/{id}/git/branches`
- `GET /api/sessions/{id}/git/log`

**Used by**: Features 3, 9

### 2c. Enhanced Stream Event Parsing

Extend `session_manager.py._parse_event()`:

- Parse `tool_result` content blocks → `TOOL_RESULT` WSMessage with `{ tool_name, content: [{ type, text?, language? }], is_error }`
- Detect diff content in tool results (starts with `---` or `diff --git`) → flag `content_type: "diff"`
- Capture bash stdout/stderr with ANSI codes → `BASH_OUTPUT` WSMessage `{ output, stream: "stdout"|"stderr" }`
- Forward `rate_limit_event` → `RATE_LIMIT` WSMessage with full `rate_limit_info`
- Enrich `modelUsage` parsing → separate `cache_read_tokens`, `cache_write_tokens` fields on session

New `WSMessageType` entries: `TOOL_RESULT`, `BASH_OUTPUT`

**Used by**: Features 5, 9, 13

### 2d. Search & Export

Extend `session_manager.py`:

- `search_sessions(query: str)` → iterate persisted session files, search message text fields, return matches with snippets
- `export_session(session_id: str)` → return full session dict with all messages

Endpoints:
- `GET /api/sessions/search?q=...`
- `GET /api/sessions/{id}/export`

**Used by**: Feature 10

### 2e. Approval Rules Engine

**New module**: `src/claude_code_remote/approval_rules.py`

- `ApprovalRule` model: `{ id, tool_pattern: str, action: "approve"|"deny", project_dir: str|None, created_at }`
- Persist to `~/.local/state/claude-code-remote/approval_rules.json`
- `check_rules(tool_name, project_dir)` → returns matching rule or None
- Hook (`ccr_approval.py`) calls `check_rules()` before routing to mobile

Endpoints: `GET /api/approval-rules`, `POST /api/approval-rules`, `DELETE /api/approval-rules/{id}`

**Used by**: Feature 8

### 2f. MCP Config Management

**New module**: `src/claude_code_remote/mcp.py`

- Read/write MCP configs: global `~/.claude/.mcp.json` + per-project `.mcp.json`
- `MCPServer` model: `{ name, type: "stdio"|"sse", command?, url?, env?: {}, args?: [] }`
- Health check: attempt connection, return latency or error
- Merge global + project configs for display

Endpoints:
- `GET /api/mcp/servers?project_dir=...`
- `POST /api/mcp/servers` (body: `{ server config, scope: "global"|"project", project_dir? }`)
- `PUT /api/mcp/servers/{name}`
- `DELETE /api/mcp/servers/{name}?scope=...&project_dir=...`
- `POST /api/mcp/servers/{name}/health`

**Used by**: Feature 12

### 2g. Skill Discovery

- Run `claude --print-skills` (or parse from Claude Code's known skill set) to get available skills
- Cache with 5min TTL
- Return: `[{ name, description, parameters?: [{ name, type, required }] }]`

Endpoint: `GET /api/skills`

**Used by**: Feature 14

### 2h. Session Config Extensions

Extend `SessionCreate` model:
- `model: str | None = None` → pass as `--model <model>`
- `allowed_tools: list[str] | None = None` → pass as `--allowedTools <comma-separated>`

Extend `send_prompt()` to include these flags when spawning new processes.

**Used by**: Feature 2

### 2i. Template Enhancements

Extend `Template` model:
- `is_builtin: bool = False`
- `tags: list[str] = []`

Seed built-in templates on first startup:
- Code Review, Test Generation, Documentation, Refactor, Bug Fix, Security Audit

Extend `GET /api/templates` with `?tag=...` filter.

**Used by**: Feature 6

### 2j. Workflow Orchestration

**New module**: `src/claude_code_remote/workflows.py`

- `WorkflowStep` model: `{ id, session_config: SessionCreate, depends_on: [step_id], status }`
- `Workflow` model: `{ id, name, steps: [WorkflowStep], status, created_at }`
- Execution engine: topological sort, spawn sessions in parallel where dependencies allow
- Persist to `~/.local/state/claude-code-remote/workflows/`

Endpoints:
- `GET /api/workflows`, `POST /api/workflows`
- `GET /api/workflows/{id}`, `DELETE /api/workflows/{id}`
- `POST /api/workflows/{id}/run`
- `GET /api/workflows/{id}/status` (includes per-step status)

**Used by**: Feature 11

### 2k. Session Collaboration

Extend `Session` model:
- `owner: str | None = None` — Tailscale identity of creator
- `collaborators: list[str] = []` — allowed Tailscale identities
- `require_multi_approval: bool = False`

Auth middleware: check session owner or collaborator list for non-public endpoints.

Endpoints:
- `POST /api/sessions/{id}/collaborators` (body: `{ identity }`)
- `DELETE /api/sessions/{id}/collaborators/{identity}`

**Used by**: Feature 15

---

## Layer 1: App Foundation Components

### 1a. ProgressMeter
Animated horizontal bar with percentage, label, subtitle. Color thresholds: green (>50%) → orange (20-50%) → red (<20%). Supports reserve segment (different shade within the bar).

**Used by**: 1, 4, 7

### 1b. ExpandableCard
Collapsible card — header with icon + title + badge, tap to expand/collapse. Animated height transition via Reanimated.

**Used by**: 5, 9, 12, 13

### 1c. SyntaxHighlightedText
Code block with language-aware coloring. Uses a lightweight tokenizer (regex-based, not a full parser) with theme tokens from `ColorPalette`. Supports line numbers, word wrap toggle.

**Used by**: 5, 9, 13

### 1d. DiffViewer
Unified diff renderer. Parses diff string into hunks. Green/red line backgrounds, file headers, hunk separators `@@`. Built on SyntaxHighlightedText for code content within hunks.

**Used by**: 3, 9

### 1e. AnsiRenderer
Converts ANSI escape sequences to styled `<Text>` spans. Handles: 16 colors, 256 colors, bold, dim, underline, reset. Memoized parsing.

**Used by**: 13

### 1f. ChipSelector
Multi-select chip row with checkmark toggles. Horizontal scroll. `selected: string[]`, `options: { value, label }[]`, `onChange`.

**Used by**: 2, 6, 8, 14

### 1g. SearchBar
Text input with search icon, 300ms debounce, clear button. Props: `placeholder`, `onSearch(query)`, `value`.

**Used by**: 10, 14

### 1h. TimeCountdown
Live countdown display from seconds. Format: "2h 55m", "5d 15h", "45s". Ticks every 60s (or every 1s when < 5min). Memoized formatter.

**Used by**: 1, 7

### 1i. DAGView
Simple directed graph. Nodes positioned by topological layer (left to right). Edges drawn with `react-native-svg` lines. Nodes are tappable, show status color.

**Used by**: 11

### 1j. ModelPicker
Bottom sheet with model list. Shows model name + capability tier. Static list: claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5. Extensible.

**Used by**: 2, 6

### 1k. FileList
Vertical list of files with status icons: M (orange), A (green), D (red), ? (gray). Tappable rows. Shows file path relative to project root.

**Used by**: 3, 9

### 1l. TrendChart
Sparkline/bar chart using `react-native-svg`. Props: `data: { date, value }[]`, `type: "bar"|"line"`, `height`. X-axis labels, Y-axis auto-scaled.

**Used by**: 7

### 1m. StatusDot
Small colored circle: green/yellow/red/gray. Optional pulse animation (Reanimated). Size variants: sm (8px), md (12px).

**Used by**: 12, 15

### 1n. AvatarRow
Horizontal row of circular pills with initials derived from identity string. Overlap style. "+Add" button at end. `onAdd`, `onRemove` callbacks.

**Used by**: 15

---

## Layer 2: Feature Integration (10 Agent Groups)

### Group 1: Usage & Analytics (Features 1, 4, 7)

**Files touched (app)**:
- NEW `app/(tabs)/settings/usage.tsx` — Usage Dashboard screen
- NEW `app/(tabs)/settings/analytics.tsx` — Usage Analytics screen
- EDIT `app/(tabs)/sessions/[id].tsx` — enhanced info bar with context visualizer
- EDIT `lib/api.ts` — add `useUsageData()`, `useUsageHistory()` hooks
- EDIT `lib/types.ts` — add `UsageData`, `UsageHistory` types

**Usage Dashboard**: Three ProgressMeter rows (session, weekly with reserve, Sonnet) + TimeCountdown per row + extra usage bar. Plan tier badge. Polls every 60s.

**Context Visualizer**: Tap context % in info bar → modal with ProgressMeter + token breakdown (input, output, cache read, cache write as stacked segments).

**Usage Analytics**: TrendChart showing 7-day quota usage trend. Per-model table. Reset timer summary.

### Group 2: Session Config & Templates (Features 2, 6)

**Files touched (app)**:
- EDIT `app/(tabs)/sessions/create.tsx` — add ModelPicker, ChipSelector for tools, sandbox toggle
- EDIT `components/CreateSessionSheet.tsx` — same additions
- EDIT `app/(tabs)/settings/templates/index.tsx` — built-in presets section, tag filter
- EDIT `app/(tabs)/settings/templates/[id].tsx` — tags editor, model picker
- EDIT `lib/types.ts` — extend `SessionCreate`, `Template` types

**Session creation**: ModelPicker at top, ChipSelector for allowed tools below project selector, sandbox + skip permissions toggles.

**Templates**: "Presets" section at top of list (non-deletable, "Use" copies to user template). Tag chips for filtering.

### Group 3: Git Integration (Features 3, 9)

**Files touched (app)**:
- NEW `components/GitPanel.tsx` — collapsible git section
- EDIT `app/(tabs)/sessions/[id].tsx` — insert GitPanel below info bar
- EDIT `lib/api.ts` — add `useGitStatus()`, `useGitDiff()`, `useGitBranches()` hooks
- EDIT `lib/types.ts` — add `GitStatus`, `GitDiff`, `GitBranch` types

**Git panel**: Collapsible. Shows branch name + file counts. Tap to expand FileList. Tap file → bottom sheet with DiffViewer.

**Diff viewer**: Also triggered when ToolResultCard detects diff content — auto-renders with DiffViewer instead of plain text.

### Group 4: Tool Output & Bash (Features 5, 13)

**Files touched (app)**:
- EDIT `components/ToolResultCard.tsx` — rewrite with ExpandableCard + content type detection
- NEW `components/BashOutputCard.tsx` — AnsiRenderer in ExpandableCard
- EDIT `components/MessageCard.tsx` — add `bash_output` case
- EDIT `lib/types.ts` — add `BASH_OUTPUT` to WSMessageType

**Tool results**: Detect content type (plain text, code with language hint, diff, error). Collapsed: first 3 lines + "Show more". Expanded: full content with SyntaxHighlightedText or DiffViewer.

**Bash output**: BashOutputCard streams lines via AnsiRenderer. Auto-scrolls. Collapsed shows last 3 lines.

### Group 5: Approval Rules (Feature 8)

**Files touched (app)**:
- NEW `app/(tabs)/settings/rules.tsx` — rule management screen
- EDIT `components/ApprovalCard.tsx` — add "Always approve" quick actions
- EDIT `lib/api.ts` — add `useApprovalRules()`, `useCreateRule()`, `useDeleteRule()` hooks
- EDIT `lib/types.ts` — add `ApprovalRule` type

**Rules screen**: List of rules with tool pattern, action badge (green approve / red deny), project scope. Swipe to delete. Add form at top.

**Approval card**: Below approve/deny buttons, add "Always approve [tool]" and "Always approve [tool] in [project]" links. Tapping creates a rule and auto-approves.

### Group 6: Search & Export (Feature 10)

**Files touched (app)**:
- EDIT `app/(tabs)/sessions/index.tsx` — add SearchBar, search results mode
- EDIT `app/(tabs)/sessions/[id].tsx` — add export/share button in header
- EDIT `lib/api.ts` — add `useSearchSessions()`, `useExportSession()` hooks
- EDIT `lib/types.ts` — add `SearchResult` type

**Search**: SearchBar at top of sessions list. When query is active, switches to search results (matching sessions with message snippet previews). Clear to return to normal list.

**Export**: Share icon in session detail header. Taps `GET /api/sessions/{id}/export`, opens native share sheet with JSON.

### Group 7: MCP Management (Feature 12)

**Files touched (app)**:
- NEW `app/(tabs)/settings/mcp.tsx` — MCP servers screen
- EDIT `lib/api.ts` — add `useMCPServers()`, MCP CRUD hooks
- EDIT `lib/types.ts` — add `MCPServer` type

**MCP screen**: List of servers in ExpandableCards. Header shows name + StatusDot (health). Expanded shows type, command/URL, env vars. Health check button. "Add server" form: name, type selector, command/URL input, env var key-value pairs.

### Group 8: Skill Palette (Feature 14)

**Files touched (app)**:
- EDIT `components/CommandAutocomplete.tsx` — merge static commands + dynamic skills
- EDIT `constants/commands.ts` — add skill type
- EDIT `lib/api.ts` — add `useSkills()` hook
- EDIT `lib/types.ts` — add `Skill` type

**Enhanced autocomplete**: On `/` trigger, show static commands + skills from server. SearchBar filters both. Skills show parameter hints. Selecting a parameterized skill → inline form fields appear in autocomplete area before sending.

### Group 9: Workflows (Feature 11)

**Files touched (app)**:
- NEW `app/(tabs)/sessions/workflows/index.tsx` — workflow list
- NEW `app/(tabs)/sessions/workflows/[id].tsx` — workflow detail + builder
- NEW `app/(tabs)/sessions/workflows/_layout.tsx` — stack navigator
- EDIT `app/(tabs)/sessions/_layout.tsx` — add workflow routes
- EDIT `lib/api.ts` — add workflow CRUD + run hooks
- EDIT `lib/types.ts` — add `Workflow`, `WorkflowStep` types

**Workflow list**: Cards showing name, step count, status. "New workflow" button.

**Workflow builder**: Add steps (each opens session config form). Connect dependencies by tapping source → target. DAGView shows the graph. Run button starts execution. Live status updates per step.

### Group 10: Collaboration (Feature 15)

**Files touched (app)**:
- EDIT `app/(tabs)/sessions/[id].tsx` — AvatarRow in header, multi-approval UI
- EDIT `components/ApprovalCard.tsx` — show who approved, multi-approval progress
- EDIT `lib/api.ts` — add collaborator CRUD hooks
- EDIT `lib/types.ts` — extend `Session` with owner, collaborators

**Collaboration**: AvatarRow below session title. "Invite" opens input for Tailscale identity. Approval cards show approver identity. When `require_multi_approval` is on, approval card shows "1/2 approved" progress.

---

## Execution Order

```
Layer 0 (sequential — server foundation)
├── 2a. OAuth Usage Client
├── 2b. Git Operations
├── 2c. Enhanced Stream Parsing
├── 2d. Search & Export
├── 2e. Approval Rules Engine
├── 2f. MCP Config
├── 2g. Skill Discovery
├── 2h. Session Config Extensions
├── 2i. Template Enhancements
├── 2j. Workflow Orchestration
└── 2k. Session Collaboration

Layer 1 (parallel — 14 reusable components, no file conflicts)
├── Agent A: ProgressMeter, TimeCountdown, TrendChart
├── Agent B: ExpandableCard, SyntaxHighlightedText, DiffViewer
├── Agent C: AnsiRenderer, ChipSelector, SearchBar
├── Agent D: DAGView, ModelPicker, FileList
└── Agent E: StatusDot, AvatarRow

Layer 2 (parallel — 10 feature groups, minimal file conflicts)
├── Group 1: Usage & Analytics (1, 4, 7)
├── Group 2: Session Config & Templates (2, 6)
├── Group 3: Git Integration (3, 9)
├── Group 4: Tool Output & Bash (5, 13)
├── Group 5: Approval Rules (8)
├── Group 6: Search & Export (10)
├── Group 7: MCP Management (12)
├── Group 8: Skill Palette (14)
├── Group 9: Workflows (11)
└── Group 10: Collaboration (15)
```

## File Conflict Analysis (Layer 2)

Shared files that multiple groups edit:
- `lib/api.ts` — all groups add hooks (append-only, low conflict risk)
- `lib/types.ts` — all groups add types (append-only, low conflict risk)
- `app/(tabs)/sessions/[id].tsx` — Groups 1, 3, 6, 10 (coordinate via distinct sections: info bar, git panel, header, avatar row)
- `components/ApprovalCard.tsx` — Groups 5, 10 (coordinate: rules adds buttons, collab adds identity display)
- `components/MessageCard.tsx` — Group 4 only (adds bash_output case)

Mitigation: Groups editing `[id].tsx` should target distinct, non-overlapping sections. Types and API hooks are append-only.

## New Dependencies

- `react-native-svg` — TrendChart, DAGView (lightweight, no native rebuild needed)
- No other new dependencies. SyntaxHighlightedText uses regex tokenizer, not a library.
