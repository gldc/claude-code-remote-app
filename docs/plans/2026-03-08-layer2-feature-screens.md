# Layer 2: Feature Screens — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate all 15 features into the app using Layer 0 endpoints and Layer 1 components.

**Architecture:** 10 agent groups, each touching distinct screen files. Shared files (`lib/api.ts`, `lib/types.ts`) are append-only — agents add hooks and types at the end of the file.

**Tech Stack:** React Native 0.83, Expo Router, TanStack React Query, Zustand

**Repo:** `/Users/gldc/Developer/claude-code-remote-app`

**Critical rule for shared files:**
- `lib/types.ts`: Only APPEND new types/interfaces at the end of the file. Never modify existing types.
- `lib/api.ts`: Only APPEND new hooks at the end of the file. Never modify existing hooks.
- `lib/websocket.ts`: Only add new message types to the VALID_WS_MESSAGE_TYPES set.

---

## Group 1: Usage & Analytics (Features 1, 4, 7)

**Agent creates/modifies:**
- Create: `app/(tabs)/settings/usage.tsx`
- Create: `app/(tabs)/settings/analytics.tsx`
- Modify: `app/(tabs)/sessions/[id].tsx` (info bar section only, lines ~99-108)
- Modify: `app/(tabs)/settings/index.tsx` (add nav rows to usage + analytics)
- Modify: `app/(tabs)/settings/_layout.tsx` (add stack screens)
- Append to: `lib/api.ts`, `lib/types.ts`

### Step 1: Add types to `lib/types.ts`

Append at end:

```typescript
// --- Usage ---
export interface UsageWindow {
  percent_remaining: number;
  resets_in_seconds: number;
}

export interface UsageWindowWithReserve extends UsageWindow {
  reserve_percent: number;
}

export interface ExtraUsage {
  monthly_spend: number;
  monthly_limit: number;
}

export interface UsageData {
  session: UsageWindow;
  weekly: UsageWindowWithReserve;
  sonnet: UsageWindow;
  extra_usage: ExtraUsage;
  plan_tier: string;
  updated_at: string;
}
```

### Step 2: Add hooks to `lib/api.ts`

Append at end:

```typescript
// --- Usage ---

export function useUsageData() {
  const baseUrl = useBaseUrl();
  return useQuery<UsageData>({
    queryKey: ['usage', baseUrl],
    queryFn: () => apiFetch(baseUrl, '/api/usage'),
    enabled: !!baseUrl,
    refetchInterval: 60000,
  });
}

export function useUsageHistory(days: number = 7) {
  const baseUrl = useBaseUrl();
  return useQuery<UsageData[]>({
    queryKey: ['usage-history', baseUrl, days],
    queryFn: () => apiFetch(baseUrl, `/api/usage/history?days=${days}`),
    enabled: !!baseUrl,
    staleTime: 300000,
  });
}
```

### Step 3: Create `app/(tabs)/settings/usage.tsx`

Usage Dashboard screen:
- Fetches `useUsageData()`
- Renders 3 sections: Session, Weekly, Sonnet — each with ProgressMeter + TimeCountdown
- Extra usage bar at bottom
- Plan tier badge in header
- Pull-to-refresh

```typescript
// Key structure:
export default function UsageScreen() {
  const { data: usage, refetch, isLoading } = useUsageData();

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
      {/* Plan badge */}
      <View style={styles.planBadge}>
        <Text>{usage?.plan_tier ?? 'Unknown'} Plan</Text>
      </View>

      {/* Session meter */}
      <View style={styles.section}>
        <ProgressMeter
          label="Session"
          percent={usage?.session.percent_remaining ?? 0}
        />
        <TimeCountdown seconds={usage?.session.resets_in_seconds ?? 0} />
      </View>

      {/* Weekly meter with reserve */}
      <View style={styles.section}>
        <ProgressMeter
          label="Weekly"
          percent={usage?.weekly.percent_remaining ?? 0}
          reservePercent={usage?.weekly.reserve_percent ?? 0}
        />
        <TimeCountdown seconds={usage?.weekly.resets_in_seconds ?? 0} />
      </View>

      {/* Sonnet meter */}
      <View style={styles.section}>
        <ProgressMeter
          label="Sonnet"
          percent={usage?.sonnet.percent_remaining ?? 0}
        />
        <TimeCountdown seconds={usage?.sonnet.resets_in_seconds ?? 0} />
      </View>

      {/* Extra usage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Extra Usage</Text>
        <ProgressMeter
          label={`$${usage?.extra_usage.monthly_spend.toFixed(2)} / $${usage?.extra_usage.monthly_limit.toFixed(2)}`}
          percent={usage ? (1 - usage.extra_usage.monthly_spend / Math.max(usage.extra_usage.monthly_limit, 1)) * 100 : 100}
          size="sm"
        />
      </View>
    </ScrollView>
  );
}
```

### Step 4: Create `app/(tabs)/settings/analytics.tsx`

Usage Analytics screen:
- Fetches `useUsageHistory(7)`
- TrendChart with daily usage data
- Simple data transformation: group history entries by day, average percent_remaining

### Step 5: Enhance info bar in `sessions/[id].tsx`

Replace the text-only context % with a tappable area. On tap, show modal with:
- ProgressMeter for context window
- Token breakdown: input, output, cache read, cache write
- Current model name

### Step 6: Add nav rows in settings + stack screens

In `settings/index.tsx`, add "Usage" and "Analytics" navigation rows (same pattern as Templates row).
In `settings/_layout.tsx`, add `<Stack.Screen name="usage" />` and `<Stack.Screen name="analytics" />`.

### Step 7: Commit

```bash
git commit -m "feat: add usage dashboard, analytics, and context visualizer"
```

---

## Group 2: Session Config & Templates (Features 2, 6)

**Agent creates/modifies:**
- Modify: `app/(tabs)/sessions/create.tsx` (add model picker, tools selector, toggles)
- Modify: `components/CreateSessionSheet.tsx` (same additions)
- Modify: `app/(tabs)/settings/templates/index.tsx` (add presets section)
- Modify: `app/(tabs)/settings/templates/[id].tsx` (add tags, model picker)
- Append to: `lib/types.ts` (extend SessionCreate, Template)

### Step 1: Update types

The server now accepts `allowed_tools: string[]` on SessionCreate and `tags: string[]`, `is_builtin: boolean` on Template. Add these to `lib/types.ts`:

```typescript
// Update SessionCreate — ADD fields (don't remove existing):
// allowed_tools?: string[];
// Note: model and use_sandbox already exist

// Update Template — ADD fields:
// tags: string[];
// is_builtin: boolean;
```

### Step 2: Enhance session creation screens

In `create.tsx`, add between project picker and prompt input:
1. ModelPicker component
2. ChipSelector for allowed tools (options: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Agent)
3. Row with two switches: Sandbox mode, Skip permissions (with warning text for skip)

Store selections in state, pass to `useCreateSession()` mutation.

### Step 3: Enhance template screens

In `templates/index.tsx`:
- Add "Presets" section at top (filter templates where `is_builtin === true`)
- Add ChipSelector for tag filtering
- "Use" button on preset cards → copies to new user template

In `templates/[id].tsx`:
- Add tag editor (ChipSelector with editable options)
- Add ModelPicker

### Step 4: Commit

```bash
git commit -m "feat: add expanded session config and template presets"
```

---

## Group 3: Git Integration (Features 3, 9)

**Agent creates/modifies:**
- Create: `components/GitPanel.tsx`
- Modify: `app/(tabs)/sessions/[id].tsx` (insert GitPanel below info bar)
- Modify: `components/ToolResultCard.tsx` (auto-detect diff content)
- Append to: `lib/api.ts`, `lib/types.ts`

### Step 1: Add types and hooks

```typescript
// Types
export interface GitFileStatus { path: string; status: string; }
export interface GitStatus { branch: string; modified: GitFileStatus[]; staged: GitFileStatus[]; untracked: string[]; counts: Record<string, number>; }

// Hooks
export function useGitStatus(sessionId: string) { ... }
export function useGitDiff(sessionId: string, file?: string) { ... }
export function useGitBranches(sessionId: string) { ... }
```

### Step 2: Create GitPanel

Collapsible panel using ExpandableCard:
- Header: branch name + file counts badge ("3 modified, 1 staged")
- Expanded: FileList showing all modified/staged/untracked files
- Tapping a file → fetches diff via `useGitDiff`, shows in bottom sheet with DiffViewer

### Step 3: Integrate into session detail

Insert `<GitPanel sessionId={id} />` after the info bar in `sessions/[id].tsx`.

### Step 4: Enhance ToolResultCard

In `ToolResultCard.tsx`, detect if output starts with `diff --git` or `---` and render with DiffViewer instead of plain text.

### Step 5: Commit

```bash
git commit -m "feat: add git integration panel with diff viewer"
```

---

## Group 4: Tool Output & Bash (Features 5, 13)

**Agent creates/modifies:**
- Create: `components/BashOutputCard.tsx`
- Modify: `components/ToolResultCard.tsx` (rewrite with ExpandableCard + content detection)
- Modify: `components/MessageCard.tsx` (add bash_output case)
- Append to: `lib/types.ts` (add BASH_OUTPUT type)

### Step 1: Add bash_output to WSMessageType

```typescript
// In VALID_WS_MESSAGE_TYPES set in websocket.ts, add 'bash_output'
// In types.ts WSMessageType union, add | 'bash_output'
```

### Step 2: Rewrite ToolResultCard

Replace current simple implementation with:
- Detect content type: plain text, code, diff, error
- Wrap in ExpandableCard — collapsed shows first 3 lines preview
- Code content → SyntaxHighlightedText
- Diff content → DiffViewer
- Error content → red-tinted text

### Step 3: Create BashOutputCard

```typescript
export function BashOutputCard({ output }: { output: string }) {
  // Uses ExpandableCard + AnsiRenderer
  // Collapsed: last 3 lines
  // Expanded: full output with ANSI colors
}
```

### Step 4: Add to MessageCard router

In `MessageCard.tsx` switch statement, add:
```typescript
case 'bash_output':
  return <BashOutputCard output={message.data.output} />;
```

### Step 5: Commit

```bash
git commit -m "feat: add enhanced tool result viewer and bash output streaming"
```

---

## Group 5: Approval Rules (Feature 8)

**Agent creates/modifies:**
- Create: `app/(tabs)/settings/rules.tsx`
- Modify: `app/(tabs)/settings/_layout.tsx` (add stack screen)
- Modify: `app/(tabs)/settings/index.tsx` (add nav row)
- Modify: `components/ApprovalCard.tsx` (add "always approve" actions)
- Append to: `lib/api.ts`, `lib/types.ts`

### Step 1: Add types and hooks

```typescript
export interface ApprovalRule { id: string; tool_pattern: string; action: string; project_dir: string | null; created_at: string; }

export function useApprovalRules() { ... }
export function useCreateApprovalRule() { ... }
export function useDeleteApprovalRule() { ... }
```

### Step 2: Create rules screen

List of rules with swipe-to-delete. "Add rule" section at top with tool name input, approve/deny toggle, optional project scope.

### Step 3: Enhance ApprovalCard

Below the approve/deny buttons, add two text links:
- "Always approve {toolName}" → creates global approve rule
- "Always approve {toolName} here" → creates project-scoped rule

These call `useCreateApprovalRule()` then auto-approve the current request.

### Step 4: Commit

```bash
git commit -m "feat: add approval rules management and quick-approve actions"
```

---

## Group 6: Search & Export (Feature 10)

**Agent creates/modifies:**
- Modify: `app/(tabs)/sessions/index.tsx` (add SearchBar, search mode)
- Modify: `app/(tabs)/sessions/[id].tsx` (add export button in header)
- Append to: `lib/api.ts`, `lib/types.ts`

### Step 1: Add types and hooks

```typescript
export interface SearchResult { session_id: string; session_name: string; snippet: string; message_type: string; timestamp: string; }

export function useSearchSessions(query: string) {
  const baseUrl = useBaseUrl();
  return useQuery<SearchResult[]>({
    queryKey: ['session-search', baseUrl, query],
    queryFn: () => apiFetch(baseUrl, `/api/sessions/search?q=${encodeURIComponent(query)}`),
    enabled: !!baseUrl && query.length >= 2,
  });
}

export function useExportSession(sessionId: string) {
  const baseUrl = useBaseUrl();
  return useMutation({
    mutationFn: () => apiFetch(baseUrl, `/api/sessions/${sessionId}/export`),
  });
}
```

### Step 2: Add SearchBar to sessions list

At top of sessions list, add SearchBar. When query is active, replace FlatList data with search results. Each result shows session name + snippet preview. Tapping navigates to session.

### Step 3: Add export to session detail

Share button in header right. On press: call export mutation, then `Share.share({ message: JSON.stringify(data, null, 2) })`.

### Step 4: Commit

```bash
git commit -m "feat: add session search and export"
```

---

## Group 7: MCP Management (Feature 12)

**Agent creates/modifies:**
- Create: `app/(tabs)/settings/mcp.tsx`
- Modify: `app/(tabs)/settings/_layout.tsx` (add stack screen)
- Modify: `app/(tabs)/settings/index.tsx` (add nav row)
- Append to: `lib/api.ts`, `lib/types.ts`

### Step 1: Add types and hooks

```typescript
export interface MCPServer { name: string; type: string; command?: string; args: string[]; url?: string; env: Record<string, string>; scope: string; }
export interface MCPHealthResult { name: string; healthy: boolean; latency_ms?: number; error?: string; }

export function useMCPServers(projectDir?: string) { ... }
export function useCreateMCPServer() { ... }
export function useDeleteMCPServer() { ... }
export function useMCPHealthCheck(name: string) { ... }
```

### Step 2: Create MCP screen

List of servers using ExpandableCard:
- Header: server name + StatusDot (health)
- Expanded: type, command/URL, env vars table
- Health check button → calls health endpoint, updates StatusDot
- "Add server" form at bottom: name, type picker (stdio/sse), command/URL, env vars

### Step 3: Commit

```bash
git commit -m "feat: add MCP server management screen"
```

---

## Group 8: Skill Palette (Feature 14)

**Agent creates/modifies:**
- Modify: `components/CommandAutocomplete.tsx` (merge static + dynamic skills)
- Modify: `constants/commands.ts` (add skill type option)
- Append to: `lib/api.ts`, `lib/types.ts`

### Step 1: Add types and hooks

```typescript
export interface Skill { name: string; description: string; parameters?: { name: string; type: string; required: boolean }[]; }

export function useSkills() {
  const baseUrl = useBaseUrl();
  return useQuery<Skill[]>({
    queryKey: ['skills', baseUrl],
    queryFn: () => apiFetch(baseUrl, '/api/skills'),
    enabled: !!baseUrl,
    staleTime: 300000,
  });
}
```

### Step 2: Enhance CommandAutocomplete

Current implementation filters COMMANDS array. Enhance to:
1. Merge static COMMANDS with skills from `useSkills()` hook
2. Skills show as type `'skill'` with server-provided description
3. Add SearchBar at top for filtering (replaces simple text match)
4. If a skill has parameters, show inline form fields before auto-sending

### Step 3: Commit

```bash
git commit -m "feat: add dynamic skill palette with parameter forms"
```

---

## Group 9: Workflows (Feature 11)

**Agent creates/modifies:**
- Create: `app/(tabs)/sessions/workflows/index.tsx`
- Create: `app/(tabs)/sessions/workflows/[id].tsx`
- Create: `app/(tabs)/sessions/workflows/_layout.tsx`
- Modify: `app/(tabs)/sessions/_layout.tsx` (add workflow routes)
- Modify: `app/(tabs)/sessions/index.tsx` (add "Workflows" button/tab)
- Append to: `lib/api.ts`, `lib/types.ts`

### Step 1: Add types and hooks

```typescript
export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'error';
export type WorkflowStatus = 'created' | 'running' | 'completed' | 'error';

export interface WorkflowStep { id: string; session_config: SessionCreate; depends_on: string[]; status: WorkflowStepStatus; session_id?: string; }
export interface Workflow { id: string; name: string; steps: WorkflowStep[]; status: WorkflowStatus; created_at: string; }

export function useWorkflows() { ... }
export function useWorkflow(id: string) { ... }
export function useCreateWorkflow() { ... }
export function useDeleteWorkflow() { ... }
export function useRunWorkflow(id: string) { ... }
```

### Step 2: Create workflow screens

**Workflow list** (`workflows/index.tsx`):
- FlatList of workflow cards (name, step count, status badge)
- FAB button → create new workflow

**Workflow detail** (`workflows/[id].tsx`):
- DAGView showing steps and dependencies
- "Add step" button → opens session config form (reuse CreateSessionSheet pattern)
- Connect dependencies by selecting "depends on" in step config
- "Run" button → calls `useRunWorkflow`
- Live status: polls workflow status, updates DAGView node colors

### Step 3: Add navigation

In `sessions/_layout.tsx`, add workflow stack screens.
In `sessions/index.tsx`, add a "Workflows" button near the top that navigates to workflow list.

### Step 4: Commit

```bash
git commit -m "feat: add workflow builder and orchestration UI"
```

---

## Group 10: Collaboration (Feature 15)

**Agent creates/modifies:**
- Modify: `app/(tabs)/sessions/[id].tsx` (add AvatarRow, invite button)
- Modify: `components/ApprovalCard.tsx` (show approver identity, multi-approval)
- Append to: `lib/api.ts`, `lib/types.ts`

### Step 1: Add types and hooks

```typescript
// Extend Session type — add:
// owner?: string;
// collaborators: string[];
// require_multi_approval: boolean;

export function useAddCollaborator(sessionId: string) {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identity: string) =>
      apiFetch(baseUrl, `/api/sessions/${sessionId}/collaborators`, {
        method: 'POST', body: JSON.stringify({ identity }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', sessionId] }),
  });
}

export function useRemoveCollaborator(sessionId: string) { ... }
```

### Step 2: Add collaboration UI to session detail

Below the session title, add AvatarRow showing `session.collaborators`. "Invite" button opens Alert.prompt for Tailscale identity input.

### Step 3: Enhance ApprovalCard for multi-approval

If `session.require_multi_approval`:
- Show "1/2 approved" progress text
- Approval card stays visible until all required approvals are collected

Show approver identity on resolved approval cards.

### Step 4: Commit

```bash
git commit -m "feat: add multi-device collaboration with invites and multi-approval"
```

---

## File Conflict Mitigation

**Shared file protocol:**

### `lib/types.ts`
Each group APPENDS types at the end. Use a comment header to mark sections:
```typescript
// --- Usage (Group 1) ---
// --- Git (Group 3) ---
// --- Approval Rules (Group 5) ---
```

### `lib/api.ts`
Same pattern — each group appends hooks with section comments.

### `app/(tabs)/sessions/[id].tsx`
Groups 1, 3, 6, 10 all modify this file. Each targets a distinct section:
- **Group 1**: Info bar enhancement (lines ~99-108)
- **Group 3**: Insert GitPanel after info bar (new JSX block)
- **Group 6**: Export button in header (headerRight)
- **Group 10**: AvatarRow below title + ApprovalCard enhancement

To avoid conflicts, execute these groups sequentially: 1 → 3 → 6 → 10.

### `components/ApprovalCard.tsx`
Groups 5 and 10 both modify. Execute 5 first (adds rule buttons), then 10 (adds multi-approval).

### `app/(tabs)/settings/index.tsx` and `_layout.tsx`
Groups 1, 5, 7 add nav rows and stack screens. Append-only — low conflict risk.

---

## Execution Order

```
Phase A (parallel — no shared files):
  Group 2: Session Config & Templates
  Group 4: Tool Output & Bash
  Group 7: MCP Management
  Group 8: Skill Palette
  Group 9: Workflows

Phase B (sequential — share sessions/[id].tsx):
  Group 1: Usage & Analytics
  Group 3: Git Integration
  Group 6: Search & Export
  Group 10: Collaboration

Phase C (sequential — share ApprovalCard):
  Group 5: Approval Rules (after Group 10)

Total: Phase A is 5 parallel agents. Phase B is 4 sequential. Phase C is 1 final.
```

After all groups complete:
1. Run `npx tsc --noEmit` to catch type errors
2. Run app in simulator to verify navigation and rendering
3. Commit any fixup changes
