import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from '@tanstack/react-query';
import { useAppStore } from './store';
import type {
  SessionSummary,
  Session,
  SessionCreate,
  SessionStatus,
  Template,
  TemplateCreate,
  Project,
  ServerStatus,
  PushSettings,
  UsageData,
  GitStatus,
  GitBranch,
  GitLogEntry,
  ApprovalRule,
  SearchResult,
  MCPServer,
  MCPHealthResult,
  Skill,
  Workflow,
  GitCheckResult,
  CronJob,
  CronJobCreate,
  CronJobUpdate,
  CronJobRun,
} from './types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3000,
      retry: (failureCount, error) => {
        // Never retry 403 Forbidden responses
        if (error instanceof Error && error.message.startsWith('Forbidden:')) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

export function useBaseUrl() {
  const { address, port } = useAppStore((s) => s.hostConfig);
  if (!address) return '';
  return `http://${address}:${port}`;
}

async function apiFetch<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    if (resp.status === 403) {
      throw new Error(`Forbidden: ${body}`);
    }
    throw new Error(`API error ${resp.status}: ${body}`);
  }
  if (resp.status === 204) return undefined as T;
  return resp.json();
}

// --- Sessions ---

export function useSessionsList(status?: SessionStatus, archived?: boolean) {
  const baseUrl = useBaseUrl();
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (archived !== undefined) params.set('archived', String(archived));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return useQuery<SessionSummary[]>({
    queryKey: ['sessions', baseUrl, status, archived],
    queryFn: () => apiFetch(baseUrl, `/api/sessions${qs}`),
    enabled: !!baseUrl,
    refetchInterval: 5000,
  });
}

export function useArchiveSession() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      apiFetch(baseUrl, `/api/sessions/${id}/${archived ? 'archive' : 'unarchive'}`, {
        method: 'POST',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useSession(id: string) {
  const baseUrl = useBaseUrl();
  return useQuery<Session>({
    queryKey: ['session', baseUrl, id],
    queryFn: () => apiFetch(baseUrl, `/api/sessions/${id}`),
    enabled: !!baseUrl && !!id,
    refetchInterval: 5000,
  });
}

const MAX_SESSION_NAME_LENGTH = 200;

export function useCreateSession() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SessionCreate) => {
      if (!data.project_dir || !data.project_dir.trim()) {
        return Promise.reject(new Error('Project directory cannot be empty'));
      }
      if (data.name && data.name.length > MAX_SESSION_NAME_LENGTH) {
        return Promise.reject(
          new Error(`Session name exceeds maximum length of ${MAX_SESSION_NAME_LENGTH} characters`)
        );
      }
      return apiFetch<Session>(baseUrl, '/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          name: data.name?.trim(),
          project_dir: data.project_dir.trim(),
        }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useDeleteSession() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(baseUrl, `/api/sessions/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useRenameSession() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiFetch(baseUrl, `/api/sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['session', baseUrl, variables.id] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

const MAX_PROMPT_LENGTH = 50000;

export function useSendPrompt(sessionId: string) {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prompt: string) => {
      const sanitized = prompt.trim();
      if (!sanitized) {
        return Promise.reject(new Error('Prompt cannot be empty'));
      }
      if (sanitized.length > MAX_PROMPT_LENGTH) {
        return Promise.reject(
          new Error(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`)
        );
      }
      return apiFetch(baseUrl, `/api/sessions/${sessionId}/send`, {
        method: 'POST',
        body: JSON.stringify({ prompt: sanitized }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', sessionId] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useApproveToolUse(sessionId: string) {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(baseUrl, `/api/sessions/${sessionId}/approve`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', sessionId] }),
  });
}

export function useDenyToolUse(sessionId: string) {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) =>
      apiFetch(baseUrl, `/api/sessions/${sessionId}/deny`, {
        method: 'POST',
        body: JSON.stringify({ approved: false, reason }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', sessionId] }),
  });
}

export function usePauseSession(sessionId: string) {
  const baseUrl = useBaseUrl();
  return useMutation({
    mutationFn: () =>
      apiFetch(baseUrl, `/api/sessions/${sessionId}/pause`, { method: 'POST' }),
  });
}

// --- Templates ---

export function useTemplatesList() {
  const baseUrl = useBaseUrl();
  return useQuery<Template[]>({
    queryKey: ['templates', baseUrl],
    queryFn: () => apiFetch(baseUrl, '/api/templates'),
    enabled: !!baseUrl,
    staleTime: 30000,
  });
}

export function useCreateTemplate() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TemplateCreate) =>
      apiFetch<Template>(baseUrl, '/api/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useUpdateTemplate() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: TemplateCreate & { id: string }) =>
      apiFetch<Template>(baseUrl, `/api/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useDeleteTemplate() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(baseUrl, `/api/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

// --- Projects ---

export function useProjectsList() {
  const baseUrl = useBaseUrl();
  return useQuery<Project[]>({
    queryKey: ['projects', baseUrl],
    queryFn: () => apiFetch(baseUrl, '/api/projects'),
    enabled: !!baseUrl,
    staleTime: 5000,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasCloning = data?.some((p) => p.status === 'cloning');
      return hasCloning ? 3000 : 30000;
    },
  });
}

export function useCreateProject() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      apiFetch<Project>(baseUrl, '/api/projects/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useCloneProject() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { url: string; name?: string }) =>
      apiFetch<Project>(baseUrl, '/api/projects/clone', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useGitCheck() {
  const baseUrl = useBaseUrl();
  return useQuery<GitCheckResult>({
    queryKey: ['git-check', baseUrl],
    queryFn: () => apiFetch(baseUrl, '/api/projects/git-check'),
    enabled: !!baseUrl,
    staleTime: 60000,
  });
}

// --- System ---

export function useServerStatus() {
  const baseUrl = useBaseUrl();
  return useQuery<ServerStatus>({
    queryKey: ['server-status', baseUrl],
    queryFn: () => apiFetch(baseUrl, '/api/status'),
    enabled: !!baseUrl,
    refetchInterval: 10000,
  });
}

export function useShowCost(): boolean {
  const { data } = useServerStatus();
  // Default to true for backward compat with older servers
  return data?.show_cost ?? true;
}

// --- Push ---

export function useRegisterPushToken() {
  const baseUrl = useBaseUrl();
  return useMutation({
    mutationFn: (token: string) =>
      apiFetch(baseUrl, '/api/push/register', {
        method: 'POST',
        body: JSON.stringify({ expo_push_token: token }),
      }),
  });
}

export function usePushSettings() {
  const baseUrl = useBaseUrl();
  return useQuery<PushSettings>({
    queryKey: ['push-settings', baseUrl],
    queryFn: () => apiFetch(baseUrl, '/api/push/settings'),
    enabled: !!baseUrl,
  });
}

export function useUpdatePushSettings() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: PushSettings) =>
      apiFetch(baseUrl, '/api/push/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['push-settings'] }),
  });
}

// --- Usage (Group 1) ---

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

// --- Git (Group 3) ---

export function useGitStatus(sessionId: string) {
  const baseUrl = useBaseUrl();
  return useQuery<GitStatus>({
    queryKey: ['git-status', baseUrl, sessionId],
    queryFn: () => apiFetch(baseUrl, `/api/sessions/${sessionId}/git/status`),
    enabled: !!baseUrl && !!sessionId,
    staleTime: 10000,
  });
}

export function useGitDiff(sessionId: string, file?: string) {
  const baseUrl = useBaseUrl();
  const qs = file ? `?file=${encodeURIComponent(file)}` : '';
  return useQuery<{ diff: string }>({
    queryKey: ['git-diff', baseUrl, sessionId, file],
    queryFn: () => apiFetch(baseUrl, `/api/sessions/${sessionId}/git/diff${qs}`),
    enabled: !!baseUrl && !!sessionId,
  });
}

export function useGitBranches(sessionId: string) {
  const baseUrl = useBaseUrl();
  return useQuery<GitBranch[]>({
    queryKey: ['git-branches', baseUrl, sessionId],
    queryFn: () => apiFetch(baseUrl, `/api/sessions/${sessionId}/git/branches`),
    enabled: !!baseUrl && !!sessionId,
  });
}

export function useGitLog(sessionId: string, n: number = 10) {
  const baseUrl = useBaseUrl();
  return useQuery<GitLogEntry[]>({
    queryKey: ['git-log', baseUrl, sessionId],
    queryFn: () => apiFetch(baseUrl, `/api/sessions/${sessionId}/git/log?n=${n}`),
    enabled: !!baseUrl && !!sessionId,
  });
}

// --- Approval Rules (Group 5) ---

export function useApprovalRules() {
  const baseUrl = useBaseUrl();
  return useQuery<ApprovalRule[]>({
    queryKey: ['approval-rules', baseUrl],
    queryFn: () => apiFetch(baseUrl, '/api/approval-rules'),
    enabled: !!baseUrl,
  });
}

export function useCreateApprovalRule() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { tool_pattern: string; action: string; project_dir?: string }) =>
      apiFetch<ApprovalRule>(baseUrl, '/api/approval-rules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approval-rules'] }),
  });
}

export function useDeleteApprovalRule() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(baseUrl, `/api/approval-rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approval-rules'] }),
  });
}

// --- Search & Export (Group 6) ---

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

// --- MCP (Group 7) ---

export function useMCPServers(projectDir?: string) {
  const baseUrl = useBaseUrl();
  const qs = projectDir ? `?project_dir=${encodeURIComponent(projectDir)}` : '';
  return useQuery<MCPServer[]>({
    queryKey: ['mcp-servers', baseUrl, projectDir],
    queryFn: () => apiFetch(baseUrl, `/api/mcp/servers${qs}`),
    enabled: !!baseUrl,
  });
}

export function useCreateMCPServer() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MCPServer>) =>
      apiFetch<MCPServer>(baseUrl, '/api/mcp/servers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp-servers'] }),
  });
}

export function useDeleteMCPServer() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<void>(baseUrl, `/api/mcp/servers/${encodeURIComponent(name)}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp-servers'] }),
  });
}

export function useMCPHealthCheck(name: string) {
  const baseUrl = useBaseUrl();
  return useQuery<MCPHealthResult>({
    queryKey: ['mcp-health', baseUrl, name],
    queryFn: () => apiFetch(baseUrl, `/api/mcp/servers/${encodeURIComponent(name)}/health`),
    enabled: false, // Manual trigger only
  });
}

// --- Skills (Group 8) ---

export function useSkills() {
  const baseUrl = useBaseUrl();
  return useQuery<Skill[]>({
    queryKey: ['skills', baseUrl],
    queryFn: () => apiFetch(baseUrl, '/api/skills'),
    enabled: !!baseUrl,
    staleTime: 300000,
  });
}

// --- Workflows (Group 9) ---

export function useWorkflows() {
  const baseUrl = useBaseUrl();
  return useQuery<Workflow[]>({
    queryKey: ['workflows', baseUrl],
    queryFn: () => apiFetch(baseUrl, '/api/workflows'),
    enabled: !!baseUrl,
  });
}

export function useWorkflow(id: string) {
  const baseUrl = useBaseUrl();
  return useQuery<Workflow>({
    queryKey: ['workflow', baseUrl, id],
    queryFn: () => apiFetch(baseUrl, `/api/workflows/${id}`),
    enabled: !!baseUrl && !!id,
    refetchInterval: 5000,
  });
}

export function useCreateWorkflow() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; steps: any[] }) =>
      apiFetch<Workflow>(baseUrl, '/api/workflows', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });
}

export function useDeleteWorkflow() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(baseUrl, `/api/workflows/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });
}

export function useRunWorkflow(id: string) {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(baseUrl, `/api/workflows/${id}/run`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow', id] }),
  });
}

export function useAddWorkflowStep(workflowId: string) {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { session_config: SessionCreate; depends_on?: string[] }) =>
      apiFetch<Workflow>(baseUrl, `/api/workflows/${workflowId}/steps`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow', baseUrl, workflowId] }),
  });
}

// --- Collaboration (Group 10) ---

export function useAddCollaborator(sessionId: string) {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identity: string) =>
      apiFetch(baseUrl, `/api/sessions/${sessionId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ identity }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', sessionId] }),
  });
}

export function useRemoveCollaborator(sessionId: string) {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identity: string) =>
      apiFetch<void>(baseUrl, `/api/sessions/${sessionId}/collaborators/${encodeURIComponent(identity)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', sessionId] }),
  });
}

// --- Cron Jobs (Group 11) ---

export function useCronJobsList() {
  const baseUrl = useBaseUrl();
  return useQuery<CronJob[]>({
    queryKey: ['cron-jobs', baseUrl],
    queryFn: () => apiFetch(baseUrl, '/api/cron-jobs'),
    enabled: !!baseUrl,
    refetchInterval: 10000,
  });
}

export function useCronJob(id: string) {
  const baseUrl = useBaseUrl();
  return useQuery<CronJob>({
    queryKey: ['cron-job', baseUrl, id],
    queryFn: () => apiFetch(baseUrl, `/api/cron-jobs/${id}`),
    enabled: !!baseUrl && !!id,
    refetchInterval: 10000,
  });
}

export function useCreateCronJob() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CronJobCreate) =>
      apiFetch<CronJob>(baseUrl, '/api/cron-jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cron-jobs'] }),
  });
}

export function useUpdateCronJob() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: CronJobUpdate & { id: string }) =>
      apiFetch<CronJob>(baseUrl, `/api/cron-jobs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cron-jobs'] });
      qc.invalidateQueries({ queryKey: ['cron-job'] });
    },
  });
}

export function useDeleteCronJob() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(baseUrl, `/api/cron-jobs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cron-jobs'] });
      qc.invalidateQueries({ queryKey: ['cron-job'] });
    },
  });
}

export function useToggleCronJob() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CronJob>(baseUrl, `/api/cron-jobs/${id}/toggle`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cron-jobs'] });
      qc.invalidateQueries({ queryKey: ['cron-job'] });
    },
  });
}

export function useTriggerCronJob() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(baseUrl, `/api/cron-jobs/${id}/trigger`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cron-jobs'] });
      qc.invalidateQueries({ queryKey: ['cron-job'] });
      qc.invalidateQueries({ queryKey: ['cron-job-history'] });
    },
  });
}

export function useCronJobHistory(id: string) {
  const baseUrl = useBaseUrl();
  return useQuery<CronJobRun[]>({
    queryKey: ['cron-job-history', baseUrl, id],
    queryFn: () => apiFetch(baseUrl, `/api/cron-jobs/${id}/history`),
    enabled: !!baseUrl && !!id,
    refetchInterval: 15000,
  });
}
