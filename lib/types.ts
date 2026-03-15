export type SessionStatus =
  | 'created'
  | 'running'
  | 'idle'
  | 'awaiting_approval'
  | 'paused'
  | 'completed'
  | 'error';

export type ProjectType = 'python' | 'node' | 'rust' | 'go' | 'unknown';

export type WSMessageType =
  | 'assistant_text'
  | 'user_message'
  | 'tool_use'
  | 'tool_result'
  | 'status_change'
  | 'approval_request'
  | 'error'
  | 'rate_limit'
  | 'cost_update'
  | 'bash_output'
  | 'ping';

export interface SessionSummary {
  id: string;
  name: string;
  project_dir: string;
  status: SessionStatus;
  model: string | null;
  created_at: string;
  updated_at: string;
  total_cost_usd: number;
  current_model: string | null;
  context_percent: number;
  git_branch: string | null;
  last_message_preview: string | null;
  archived: boolean;
  cron_job_id?: string | null;
}

export interface Session extends SessionSummary {
  template_id: string | null;
  max_budget_usd: number | null;
  messages: WSMessageData[];
  error_message: string | null;
  collaborators: string[];
}

export interface SessionCreate {
  name: string;
  project_dir: string;
  initial_prompt: string;
  template_id?: string;
  model?: string;
  max_budget_usd?: number;
  skip_permissions?: boolean;
  use_sandbox?: boolean;
  allowed_tools?: string[];
}

export interface Template {
  id: string;
  name: string;
  project_dir: string | null;
  initial_prompt: string;
  model: string | null;
  max_budget_usd: number | null;
  allowed_tools: string[] | null;
  tags: string[];
  is_builtin: boolean;
  created_at: string;
}

export interface TemplateCreate {
  name: string;
  project_dir?: string;
  initial_prompt: string;
  model?: string;
  max_budget_usd?: number;
  allowed_tools?: string[];
  tags?: string[];
}

export interface Project {
  id: string;
  name: string;
  path: string;
  type: ProjectType;
  session_count: number;
  last_session: string | null;
  status: 'ready' | 'cloning' | 'error';
  error_message: string | null;
}

export interface GitCheckResult {
  git: boolean;
  ssh_key: boolean;
  github_ssh: boolean;
}

export interface ServerStatus {
  status: string;
  active_sessions: number;
  total_sessions: number;
}

export interface PushSettings {
  notify_approvals: boolean;
  notify_completions: boolean;
  notify_errors: boolean;
}

export interface WSMessageData {
  type: WSMessageType;
  data: Record<string, any>;
  timestamp: string;
}

export interface AssistantTextData {
  text: string;
}

export interface ToolUseData {
  tool_name: string;
  tool_input: Record<string, any>;
  tool_use_id: string;
}

export interface ToolResultData {
  output: string;
  is_error: boolean;
}

export interface ApprovalRequestData {
  tool_name: string;
  tool_input: Record<string, any>;
  description: string;
}

export interface StatusChangeData {
  status: SessionStatus;
  cost_usd: number;
  duration_ms: number;
  result: string;
}

export interface StatusColors {
  [key: string]: string;
}

// --- Usage (Group 1) ---
export interface UsageWindow {
  /** 0–100 utilization percentage */
  utilization: number;
  /** ISO 8601 timestamp when the window resets */
  resets_at: string;
}

export interface ExtraUsage {
  is_enabled: boolean;
  monthly_limit: number;
  used_credits: number;
}

export interface UsageData {
  five_hour: UsageWindow;
  seven_day: UsageWindow;
  seven_day_sonnet: UsageWindow | null;
  seven_day_opus: UsageWindow | null;
  extra_usage: ExtraUsage;
  plan_tier: string;
  updated_at: string;
}

// --- Git (Group 3) ---
export interface GitFileStatus {
  path: string;
  status: string;
}

export interface GitStatus {
  branch: string;
  modified: GitFileStatus[];
  staged: GitFileStatus[];
  untracked: string[];
  counts: Record<string, number>;
}

export interface GitBranch {
  name: string;
  is_current: boolean;
}

export interface GitLogEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
}

// --- Approval Rules (Group 5) ---
export interface ApprovalRule {
  id: string;
  tool_pattern: string;
  action: string;
  project_dir: string | null;
  created_at: string;
}

// --- Search (Group 6) ---
export interface SearchResult {
  session_id: string;
  session_name: string;
  snippet: string;
  message_type: string;
  timestamp: string;
}

// --- MCP (Group 7) ---
export interface MCPServer {
  name: string;
  type: string;
  command?: string;
  args: string[];
  url?: string;
  env: Record<string, string>;
  scope: string;
}

export interface MCPHealthResult {
  name: string;
  healthy: boolean;
  latency_ms?: number;
  error?: string;
}

// --- Skills (Group 8) ---
export interface Skill {
  name: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean }[];
}

// --- Workflows (Group 9) ---
export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'error';
export type WorkflowStatus = 'created' | 'running' | 'completed' | 'error';

export interface WorkflowStep {
  id: string;
  session_config: SessionCreate;
  depends_on: string[];
  status: WorkflowStepStatus;
  session_id?: string;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  created_at: string;
}

// --- Cron Jobs (Group 10) ---
export type CronExecutionMode = 'spawn' | 'persistent';
export type CronRunStatus = 'success' | 'error' | 'running' | 'timeout';

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  execution_mode: CronExecutionMode;
  session_config: SessionCreate;
  persistent_session_id?: string;
  project_dir: string;
  timeout_minutes?: number;
  prompt_template?: string;
  created_at: string;
  updated_at: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_run_status: CronRunStatus | null;
}

export interface CronJobCreate {
  name: string;
  schedule: string;
  execution_mode: CronExecutionMode;
  session_config: SessionCreate;
  persistent_session_id?: string;
  project_dir?: string;
  timeout_minutes?: number;
  prompt_template?: string;
  enabled?: boolean;
}

export interface CronJobUpdate {
  name?: string;
  schedule?: string;
  execution_mode?: CronExecutionMode;
  session_config?: SessionCreate;
  project_dir?: string;
  timeout_minutes?: number | null;
  prompt_template?: string | null;
  enabled?: boolean;
}

export interface CronJobRun {
  id: string;
  cron_job_id: string;
  session_id: string | null;
  status: CronRunStatus;
  started_at: string;
  completed_at: string | null;
  cost_usd: number;
  error_message?: string;
}
