# Cron Jobs Feature Design

## Overview

Add recurring task scheduling to the Claude Code Remote ecosystem. Users create cron jobs from the app that execute Claude Code sessions on a schedule — either spawning a new session each run or reusing a persistent session. A new dedicated Cron tab provides management and run history.

## Data Model

### CronJob

```typescript
interface CronJob {
  id: string;
  name: string;
  schedule: string;                // cron expression (e.g. "0 9 * * 1-5")
  enabled: boolean;
  execution_mode: 'spawn' | 'persistent';
  session_config: SessionCreate;   // reuses existing session creation shape
  persistent_session_id?: string;  // only when mode = 'persistent'
  project_dir: string;             // defaults to "cron" folder on server
  timeout_minutes?: number;        // approval timeout; null = wait indefinitely
  prompt_template?: string;        // optional, supports {{date}}, {{branch}} etc.
  created_at: string;
  updated_at: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_run_status: CronRunStatus | null;
}
```

### CronJobCreate

```typescript
interface CronJobCreate {
  name: string;
  schedule: string;
  execution_mode: 'spawn' | 'persistent';
  session_config: SessionCreate;
  persistent_session_id?: string;  // optional; for 'persistent' mode, auto-created on first run if omitted
  project_dir?: string;            // defaults to "cron"
  timeout_minutes?: number;
  prompt_template?: string;
  enabled?: boolean;               // defaults true
}

interface CronJobUpdate {
  name?: string;
  schedule?: string;
  execution_mode?: CronExecutionMode;
  session_config?: SessionCreate;
  project_dir?: string;
  timeout_minutes?: number | null;
  prompt_template?: string | null;
  enabled?: boolean;
}
```

### CronJobRun

```typescript
interface CronJobRun {
  id: string;
  cron_job_id: string;
  session_id: string | null;    // null if session creation failed
  status: CronRunStatus;
  started_at: string;
  completed_at: string | null;
  cost_usd: number;
  error_message?: string;
}
```

### Supporting Types

```typescript
type CronExecutionMode = 'spawn' | 'persistent';
type CronRunStatus = 'success' | 'error' | 'running' | 'timeout';
```

### Key Decisions

- `session_config` is embedded (not a template reference) so each cron job is self-contained.
- `execution_mode: 'spawn'` creates a new session each run; `'persistent'` reuses one session and sends the prompt to it.
- `project_dir` defaults to a `cron` folder if omitted.
- `prompt_template` is optional — if set, the server substitutes variables and uses the result as the prompt, ignoring `session_config.initial_prompt`. When `prompt_template` is used, `session_config.initial_prompt` can be set to a placeholder value (e.g. the raw template string) since it won't be sent.
- Sessions spawned by cron jobs include a `cron_job_id` field for identification. This requires adding `cron_job_id?: string` to both `SessionSummary` and `Session` interfaces in `lib/types.ts`, and the corresponding field on the server's `Session` model.
- For persistent mode, if `persistent_session_id` is not provided at creation, the first run creates a new session and auto-populates it.

## Server Architecture (claude-code-remote)

### New File: `cron_manager.py`

Follows the `TemplateStore` / `WorkflowEngine` pattern:

- **Storage**: Individual JSON files in `~/.local/state/claude-code-remote/cron_jobs/` (one file per cron job).
- **Run history**: JSONL file `cron_history.jsonl` (same pattern as `usage_history.jsonl`), one `CronJobRun` per line.
- **Scheduling**: `APScheduler` (async) — registers/removes scheduler jobs when cron entries are created, updated, or deleted. Scheduler starts in FastAPI lifespan startup, stops on shutdown.
- **Execution**: On trigger, calls `session_mgr.create_session()` + `session_mgr.send_prompt()` for spawn mode, or just `send_prompt()` for persistent mode.
- **Template variables**: Simple string substitution on `prompt_template` before sending (e.g. `{{date}}` → `2026-03-15`, `{{branch}}` → current git branch from project dir).

### Pydantic Models (in `models.py`)

```python
class CronExecutionMode(str, Enum):
    SPAWN = "spawn"
    PERSISTENT = "persistent"

class CronRunStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    RUNNING = "running"
    TIMEOUT = "timeout"

class CronJob(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    name: str
    schedule: str
    enabled: bool = True
    execution_mode: CronExecutionMode
    session_config: SessionCreate
    persistent_session_id: str | None = None
    project_dir: str = "cron"
    timeout_minutes: int | None = None
    prompt_template: str | None = None
    created_at: datetime
    updated_at: datetime
    next_run_at: datetime | None = None
    last_run_at: datetime | None = None
    last_run_status: CronRunStatus | None = None

class CronJobCreate(BaseModel):
    name: str
    schedule: str
    execution_mode: CronExecutionMode
    session_config: SessionCreate
    persistent_session_id: str | None = None
    project_dir: str = "cron"
    timeout_minutes: int | None = None
    prompt_template: str | None = None
    enabled: bool = True

class CronJobUpdate(BaseModel):
    name: str | None = None
    schedule: str | None = None
    execution_mode: CronExecutionMode | None = None
    session_config: SessionCreate | None = None
    project_dir: str | None = None
    timeout_minutes: int | None = None
    prompt_template: str | None = None
    enabled: bool | None = None

class CronJobRun(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    cron_job_id: str
    session_id: str | None = None
    status: CronRunStatus = CronRunStatus.RUNNING
    started_at: datetime
    completed_at: datetime | None = None
    cost_usd: float = 0.0
    error_message: str | None = None
```

### API Routes (added to `routes.py`)

```
GET    /api/cron-jobs                        # list all cron jobs
POST   /api/cron-jobs                        # create cron job
GET    /api/cron-jobs/{id}                   # get one cron job
PATCH  /api/cron-jobs/{id}                   # partial update (CronJobUpdate); also re-registers APScheduler job if schedule changes
DELETE /api/cron-jobs/{id}                   # delete cron job + unregister scheduler
POST   /api/cron-jobs/{id}/toggle            # convenience endpoint: flips enabled, registers/unregisters APScheduler job atomically
POST   /api/cron-jobs/{id}/trigger           # run now (manual trigger, bypasses schedule)
GET    /api/cron-jobs/{id}/history           # run history list; supports ?limit=N&offset=N (defaults: limit=50, offset=0)
```

### Wiring (in `server.py`)

- `CronManager` instantiated in `create_app()`, receives `session_mgr` reference.
- Scheduler starts in the lifespan startup, stops on shutdown.
- `CRON_DIR` added to `config.py` + `ensure_dirs()`.

### Cron Expression Validation

The server validates cron expressions on create and update using `croniter` (or APScheduler's built-in parser). Invalid expressions return HTTP 422 with a descriptive error message. The app displays this as an inline validation error below the schedule input.

### Concurrent Run Prevention

If a cron job triggers while a previous run is still `running`, the new run is **skipped** and a warning is logged. This prevents resource exhaustion and avoids confusing state for persistent-mode jobs. The skipped run is not recorded in history.

### Session Identification

Sessions created by cron jobs include a `cron_job_id` field on the `Session` model. This allows the app to display a visual badge (clock icon) on cron-spawned sessions.

## App Architecture (claude-code-remote-app)

### Navigation

New bottom tab: **Cron** — added as the 2nd tab between Sessions and Projects, resulting in tab order: Sessions, Cron, Projects, Settings. Configured in `app/(tabs)/_layout.tsx`.

### Screen Structure

```
app/(tabs)/cron/
├── _layout.tsx            # Stack navigator for cron screens
├── index.tsx              # Cron job list (main tab view)
└── [id].tsx               # Cron job detail (config summary + run history)
```

### Cron List (`index.tsx`)

- List of cron jobs as cards showing: name, human-readable schedule, next run, last run status, enabled toggle.
- FAB or header button opens a **bottom sheet** (consistent with session creation pattern via `CreateSessionSheet`).
- Filter chips: All / Active / Disabled.
- **Swipe-to-delete** on list items (consistent with sessions tab pattern).

### Create Cron Job (Bottom Sheet)

Uses `@gorhom/bottom-sheet` (same pattern as `CreateSessionSheet.tsx`):

- Reuses the same form fields as session creation: project picker, prompt, model, permissions, sandbox, tools, budget.
- **Additional fields**:
  - **Schedule picker** (`SchedulePicker` component): Structured mode with frequency chips (Hourly / Daily / Weekly / Monthly) + conditional time picker + day-of-week chips.
  - **Advanced toggle**: Raw cron expression `TextInput` with human-readable preview below.
  - **Execution mode toggle**: "New session each run" vs "Reuse persistent session".
  - **Approval timeout**: Optional number input (minutes).
  - **Prompt template field**: Optional `TextInput` with variable hint text showing available variables.

### Detail (`[id].tsx`)

- **Top section**: Cron job config summary, enable/disable toggle, "Run Now" button.
- **Bottom section**: Scrollable run history list — each row shows timestamp, status badge, cost. Tapping navigates to the linked session.

### New Component: `SchedulePicker.tsx`

```
components/SchedulePicker.tsx
```

- **Structured mode** (default): Frequency chips (Hourly / Daily / Weekly / Monthly) → conditional time picker + day-of-week chips for weekly. Generates cron expression under the hood.
- **Advanced mode**: `TextInput` for raw cron expression + human-readable preview text below (e.g. "Every weekday at 9:00 AM").
- Toggle between modes via a small "Advanced" / "Simple" link.

### New API Hooks (`lib/api.ts`)

Following existing React Query patterns:

| Hook | Method | Polling |
|------|--------|---------|
| `useCronJobsList()` | GET `/api/cron-jobs` | 10s |
| `useCronJob(id)` | GET `/api/cron-jobs/{id}` | 10s |
| `useCreateCronJob()` | POST `/api/cron-jobs` | — |
| `useUpdateCronJob()` | PATCH `/api/cron-jobs/{id}` | — |
| `useDeleteCronJob()` | DELETE `/api/cron-jobs/{id}` | — |
| `useToggleCronJob(id)` | POST `/api/cron-jobs/{id}/toggle` | — |
| `useTriggerCronJob(id)` | POST `/api/cron-jobs/{id}/trigger` | — |
| `useCronJobHistory(id)` | GET `/api/cron-jobs/{id}/history` | 15s |

### Session Badge

`SessionCard` and `StatusBadge` components show a small clock icon when a session has a `cron_job_id`, visually identifying it as cron-spawned.

## UI Patterns

All UI follows existing patterns established in the app:

- **Theming**: `useColors()` + `useThemedStyles()` with `ColorPalette` tokens from `constants/theme.ts`.
- **Bottom sheet creation**: `@gorhom/bottom-sheet` with `BottomSheetScrollView`, animated title, same pattern as `CreateSessionSheet.tsx`.
- **Swipe-to-delete**: Same gesture handling as session list items.
- **Filter chips**: `FilterChips` component for list filtering.
- **Status badges**: `StatusBadge` component for run status display.
- **Haptic feedback**: `Haptics.impactAsync()` on form submission.
- **Navigation**: Expo Router file-based routing with `router.push()` / `router.replace()`.

## Template Variables

Supported variables for `prompt_template`:

| Variable | Value |
|----------|-------|
| `{{date}}` | Current date (ISO 8601) |
| `{{time}}` | Current time (ISO 8601) |
| `{{datetime}}` | Current datetime (ISO 8601) |
| `{{branch}}` | Current git branch in project dir |
| `{{project}}` | Project directory name |
| `{{run_number}}` | Sequential run count for this cron job |

## Error Handling

- **Server down during scheduled run**: CronManager logs the error, records a failed run in history, and retries on the next scheduled interval (no retry loops).
- **Session creation fails**: Run recorded as `error` with error message. Cron job remains enabled.
- **Approval timeout**: If `timeout_minutes` is set and no response received, the tool use is denied, session ends, and run status is `timeout`.
- **Persistent session gone**: If the persistent session is deleted or errored, the next run creates a new session and updates `persistent_session_id`.

## Scope Boundaries

**In scope:**
- CRUD for cron jobs (server + app)
- Schedule execution with APScheduler
- Run history tracking
- Bottom sheet creation form with schedule picker
- Cron tab with list, detail, and swipe-to-delete
- Session badge for cron-spawned sessions

**Out of scope (future work):**
- Retry policies (exponential backoff, max retries)
- Cron job duplication / cloning
- Bulk operations (enable/disable all)
- Notifications specific to cron runs (uses existing push notification settings)
- Complex template variable expressions (conditionals, loops)
