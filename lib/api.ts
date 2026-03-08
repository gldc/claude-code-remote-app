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
} from './types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3000,
      retry: 2,
    },
  },
});

function useBaseUrl() {
  return useAppStore((s) => s.getBaseUrl());
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
    queryKey: ['sessions', status, archived],
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
    queryKey: ['session', id],
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
    queryKey: ['templates'],
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
    queryKey: ['projects'],
    queryFn: () => apiFetch(baseUrl, '/api/projects'),
    enabled: !!baseUrl,
    staleTime: 30000,
  });
}

// --- System ---

export function useServerStatus() {
  const baseUrl = useBaseUrl();
  return useQuery<ServerStatus>({
    queryKey: ['server-status'],
    queryFn: () => apiFetch(baseUrl, '/api/status'),
    enabled: !!baseUrl,
    refetchInterval: 10000,
  });
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
    queryKey: ['push-settings'],
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
