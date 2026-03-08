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
