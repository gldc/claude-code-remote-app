# Feature Exploration — Claude Code Capabilities to Surface in Mobile App

## Current Features

- Create/manage sessions with Claude Code
- Send prompts and receive streamed responses
- Tool use approval/denial flow
- Slash commands (/commit, /compact, /cost, /clear, /review-pr, /simplify)
- Session info bar (model, context %, git branch, cost)
- Push notifications for approvals/completions/errors
- Template system for reusable session configs
- Project scanning/registration
- Session archiving
- Markdown rendering of responses

---

## Quick Wins (1-2 days each)

### 1. Expanded Session Configuration

Expose more Claude Code CLI flags as mobile toggles:
- Model selector dropdown
- Budget cap slider
- Allowed tools multi-select (Read, Write, Edit, Bash, Glob, Grep, Agent, etc.)
- Sandbox mode toggle

**Server:** Extend `SessionCreate` to include `allowed_tools` array, pass `--allowedTools` flag.

### 2. Git Integration Dashboard

- Branch display + quick branch switcher
- Git status snapshot (modified files count, staged changes)
- Quick commit action

**Server:** New endpoints: `POST /api/sessions/{id}/git/branch`, `GET /api/sessions/{id}/git/status`, `GET /api/sessions/{id}/git/diff`

### 3. Context Window Visualizer

Real-time context meter with per-model breakdown and cache info.

**Server:** Parse `modelUsage` more granularly from result events. Include cache read/write metrics.

### 4. Tool Result Viewer

Dedicated expandable card showing tool I/O with syntax highlighting and file diff previews.

**Server:** Parse `tool_result` events from stream-json. New `TOOL_RESULT` WebSocket message type.

### 5. Template Presets

Pre-built template library (Code Review, Documentation, Test Generation, etc.) with usage stats.

**Server:** Mark templates as built-in vs user-created. Add template tags/categories.

---

## Medium Effort (2-3 days each)

### 6. Cost Analytics Dashboard

Cost breakdown by model, daily/weekly trends, budget forecasting.

**Server:** Store cost metadata (date, model, session_id). New endpoint: `GET /api/analytics/costs`.

### 7. Tool Approval Pre-Filtering

Auto-approve rules, risk scoring, "remember this tool" option, deny reason capture.

**Server:** New endpoint: `POST /api/approval-rules`. Extend `SessionCreate` with `auto_approval_mode`. Store approval history.

### 8. Git Diff Viewer

Interactive unified diffs with accept/reject per-hunk.

**Server:** Parse file diff output from tool results. New `FILE_DIFF` message type with syntax highlighting metadata.

### 9. Multi-Session Workflows (Agent Teams)

Spawn multiple parallel sessions with dependency graphs. Visual DAG of agents working together.

**Server:** New `Workflow` model. Endpoints for workflow CRUD and execution. Agent output routing.

### 10. Session Archiving & Search

Full-text search across archived sessions. Export sessions to JSON for sharing.

**Server:** `GET /api/sessions/{id}/export`. Search endpoint.

---

## Ambitious (3-5 days each)

### 11. MCP Server Management

Install, configure, and monitor MCP providers (GitHub, Slack, Postgres, etc.) from mobile.

**Server:** New endpoints for MCP CRUD. Store MCP config in templates. Health checks.

### 12. Worktree & Environment Switching

Create git worktrees per session. Load environment-specific `.env` files.

**Server:** New endpoint for worktree management. Extend `SessionCreate` with `worktree_name`, `environment`.

### 13. Streaming Bash Output

Live stdout/stderr with ANSI color rendering in-app.

**Server:** Capture ANSI codes. Stream as `BASH_OUTPUT` WebSocket events. Parse ANSI to inline formatting.

### 14. Skill Palette (Extensible Slash Commands)

Discoverable skill marketplace with parameterized execution UI.

**Server:** `GET /api/skills` returning available skills with parameters. `POST /api/sessions/{id}/skill/{name}`.

### 15. Multi-Device Collaboration

Multiple users approve/comment on same session. Collaborative code review workflows.

**Server:** Session ownership model. Invite/collaborator endpoints. Multi-approval logic. Comment model.

---

## Priority Matrix

| Feature | Effort | Value | Phase |
|---------|--------|-------|-------|
| Expanded Session Config | 1d | High | Phase 1 |
| Git Integration Dashboard | 2d | High | Phase 1 |
| Tool Result Viewer | 2d | High | Phase 1 |
| Cost Analytics | 3d | High | Phase 2 |
| Tool Approval Rules | 2d | High | Phase 2 |
| Session Archiving & Search | 1d | Medium | Phase 2 |
| Context Visualizer | 1d | Medium | Phase 2 |
| Template Presets | 1d | Medium | Phase 2 |
| Multi-Session Workflows | 5d | High | Phase 3 |
| Git Diff Viewer | 2d | High | Phase 3 |
| MCP Management | 4d | Medium | Phase 3 |
| Skill Palette | 3d | High | Phase 3 |
| Worktree Switching | 3d | Medium | Future |
| Streaming Sandbox | 3d | Medium | Future |
| Multi-Device Collab | 5d | Medium | Future |
