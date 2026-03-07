export type SessionStatus =
  | 'created'
  | 'running'
  | 'awaiting_approval'
  | 'paused'
  | 'completed'
  | 'error';

export type ProjectType = 'python' | 'node' | 'rust' | 'go' | 'unknown';

export type WSMessageType =
  | 'assistant_text'
  | 'tool_use'
  | 'tool_result'
  | 'status_change'
  | 'approval_request'
  | 'error'
  | 'rate_limit'
  | 'cost_update'
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
  last_message_preview: string | null;
}

export interface Session extends SessionSummary {
  template_id: string | null;
  max_budget_usd: number | null;
  messages: WSMessageData[];
  error_message: string | null;
}

export interface SessionCreate {
  name: string;
  project_dir: string;
  initial_prompt: string;
  template_id?: string;
  model?: string;
  max_budget_usd?: number;
}

export interface Template {
  id: string;
  name: string;
  project_dir: string | null;
  initial_prompt: string;
  model: string | null;
  max_budget_usd: number | null;
  allowed_tools: string[] | null;
  created_at: string;
}

export interface TemplateCreate {
  name: string;
  project_dir?: string;
  initial_prompt: string;
  model?: string;
  max_budget_usd?: number;
  allowed_tools?: string[];
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
