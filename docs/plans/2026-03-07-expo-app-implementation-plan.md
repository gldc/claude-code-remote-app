# Claude Code Remote App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a native iOS Expo app that connects to the claude-code-remote API server over Tailscale to create, monitor, and manage Claude Code sessions with structured message rendering, inline tool approvals, and push notifications.

**Architecture:** Expo Router tab-based app (Sessions, Projects, Settings) with React Query for REST state management, zustand for local state, WebSocket for real-time session streaming, and expo-notifications for push.

**Tech Stack:** Expo SDK 52+, Expo Router, TypeScript, React Query (TanStack), zustand, expo-notifications, react-native-markdown-display

---

### Task 1: Project Scaffolding

**Step 1: Create Expo app**

```bash
cd /Users/gldc/Developer
npx create-expo-app@latest claude-code-remote-app --template tabs
```

Note: The `docs/` directory already exists from the design doc. If `create-expo-app` complains about a non-empty directory, run it with a temp name and move files.

**Step 2: Install dependencies**

```bash
cd /Users/gldc/Developer/claude-code-remote-app
npx expo install expo-notifications expo-haptics expo-linking expo-secure-store @react-native-async-storage/async-storage
npm install @tanstack/react-query zustand react-native-markdown-display
```

**Step 3: Update app.json**

Replace `app.json` with:

```json
{
  "expo": {
    "name": "Claude Code Remote",
    "slug": "claude-code-remote-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "claude-code-remote",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.gldc.claudecoderemote",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#58A6FF"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**Step 4: Verify it builds**

Run: `cd /Users/gldc/Developer/claude-code-remote-app && npx expo start --ios`

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Expo app with dependencies"
```

---

### Task 2: Theme Constants

**Files:**
- Create: `constants/theme.ts`

**Step 1: Create theme file**

```typescript
// constants/theme.ts

export const Colors = {
  background: '#0D1117',
  card: '#161B22',
  cardBorder: '#30363D',
  inputBorder: '#30363D',
  primary: '#58A6FF',
  success: '#3FB950',
  warning: '#D29922',
  error: '#F85149',
  text: '#E6EDF3',
  textMuted: '#8B949E',
  textSecondary: '#C9D1D9',
  tabBar: '#0D1117',
  tabBarBorder: '#21262D',
  tabBarActive: '#58A6FF',
  tabBarInactive: '#8B949E',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
};

export const FontFamily = {
  mono: 'Menlo',
  default: undefined, // system default
};
```

**Step 2: Commit**

```bash
git add constants/theme.ts
git commit -m "feat: add dark theme constants"
```

---

### Task 3: TypeScript Types

**Files:**
- Create: `lib/types.ts`

**Step 1: Create types file**

These types mirror the server's pydantic models.

```typescript
// lib/types.ts

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

// Convenience types for message data payloads
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
```

**Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add TypeScript types matching server API"
```

---

### Task 4: Zustand Store

**Files:**
- Create: `lib/store.ts`

**Step 1: Create store**

```typescript
// lib/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WSMessageData } from './types';

interface HostConfig {
  address: string;
  port: number;
}

interface AppState {
  // Host connection
  hostConfig: HostConfig;
  setHostConfig: (config: HostConfig) => void;
  getBaseUrl: () => string;

  // Active session messages (fed by WebSocket, not persisted)
  sessionMessages: Record<string, WSMessageData[]>;
  appendMessage: (sessionId: string, message: WSMessageData) => void;
  setMessages: (sessionId: string, messages: WSMessageData[]) => void;
  clearMessages: (sessionId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hostConfig: {
        address: '',
        port: 8080,
      },
      setHostConfig: (config) => set({ hostConfig: config }),
      getBaseUrl: () => {
        const { address, port } = get().hostConfig;
        if (!address) return '';
        return `http://${address}:${port}`;
      },

      sessionMessages: {},
      appendMessage: (sessionId, message) =>
        set((state) => ({
          sessionMessages: {
            ...state.sessionMessages,
            [sessionId]: [
              ...(state.sessionMessages[sessionId] || []),
              message,
            ],
          },
        })),
      setMessages: (sessionId, messages) =>
        set((state) => ({
          sessionMessages: {
            ...state.sessionMessages,
            [sessionId]: messages,
          },
        })),
      clearMessages: (sessionId) =>
        set((state) => {
          const { [sessionId]: _, ...rest } = state.sessionMessages;
          return { sessionMessages: rest };
        }),
    }),
    {
      name: 'claude-code-remote-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hostConfig: state.hostConfig,
      }),
    }
  )
);
```

**Step 2: Commit**

```bash
git add lib/store.ts
git commit -m "feat: add zustand store with persisted host config"
```

---

### Task 5: API Client + React Query Hooks

**Files:**
- Create: `lib/api.ts`

**Step 1: Create API client**

```typescript
// lib/api.ts
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

export function useSessionsList(status?: SessionStatus) {
  const baseUrl = useBaseUrl();
  const params = status ? `?status=${status}` : '';
  return useQuery<SessionSummary[]>({
    queryKey: ['sessions', status],
    queryFn: () => apiFetch(baseUrl, `/api/sessions${params}`),
    enabled: !!baseUrl,
    refetchInterval: 5000,
  });
}

export function useSession(id: string) {
  const baseUrl = useBaseUrl();
  return useQuery<Session>({
    queryKey: ['session', id],
    queryFn: () => apiFetch(baseUrl, `/api/sessions/${id}`),
    enabled: !!baseUrl && !!id,
  });
}

export function useCreateSession() {
  const baseUrl = useBaseUrl();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SessionCreate) =>
      apiFetch<Session>(baseUrl, '/api/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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

export function useSendPrompt(sessionId: string) {
  const baseUrl = useBaseUrl();
  return useMutation({
    mutationFn: (prompt: string) =>
      apiFetch(baseUrl, `/api/sessions/${sessionId}/send`, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      }),
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
```

**Step 2: Commit**

```bash
git add lib/api.ts
git commit -m "feat: add REST API client with React Query hooks"
```

---

### Task 6: WebSocket Hook

**Files:**
- Create: `lib/websocket.ts`

**Step 1: Create WebSocket hook**

```typescript
// lib/websocket.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from './store';
import type { WSMessageData } from './types';

export function useSessionStream(sessionId: string | null) {
  const hostConfig = useAppStore((s) => s.hostConfig);
  const appendMessage = useAppStore((s) => s.appendMessage);
  const setMessages = useAppStore((s) => s.setMessages);
  const messages = useAppStore((s) =>
    sessionId ? s.sessionMessages[sessionId] || [] : []
  );

  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (!sessionId || !hostConfig.address) return;

    const wsUrl = `ws://${hostConfig.address}:${hostConfig.port}/ws/sessions/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessageData = JSON.parse(event.data);
        if (msg.type === 'ping') return;
        appendMessage(sessionId, msg);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 3 seconds
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sessionId, hostConfig.address, hostConfig.port, appendMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { messages, isConnected, disconnect };
}
```

**Step 2: Commit**

```bash
git add lib/websocket.ts
git commit -m "feat: add WebSocket hook for session streaming"
```

---

### Task 7: Push Notifications Setup

**Files:**
- Create: `lib/notifications.ts`

**Step 1: Create notifications module**

```typescript
// lib/notifications.ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useRegisterPushToken } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowInForeground: true,
  }),
});

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const { data } = await Notifications.getExpoPushTokenAsync();
  return data;
}

export function useNotificationSetup() {
  const registerToken = useRegisterPushToken();

  useEffect(() => {
    getExpoPushToken().then((token) => {
      if (token) {
        registerToken.mutate(token);
      }
    });

    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        const sessionId = data?.session_id as string | undefined;
        if (sessionId) {
          router.push(`/(tabs)/sessions/${sessionId}`);
        }
      }
    );

    return () => subscription.remove();
  }, []);
}
```

**Step 2: Commit**

```bash
git add lib/notifications.ts
git commit -m "feat: add push notification setup and deep linking"
```

---

### Task 8: Root Layout & Tab Navigator

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`

**Step 1: Create root layout**

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/api';
import { useNotificationSetup } from '../lib/notifications';
import { Colors } from '../constants/theme';

function AppContent() {
  useNotificationSetup();
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
```

**Step 2: Create tab navigator**

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
        },
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
      }}
    >
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="terminal" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Step 3: Create stack layouts for each tab**

```typescript
// app/(tabs)/sessions/_layout.tsx
import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function SessionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Sessions' }} />
      <Stack.Screen name="create" options={{ title: 'New Session' }} />
      <Stack.Screen name="[id]" options={{ title: 'Session' }} />
    </Stack>
  );
}
```

```typescript
// app/(tabs)/projects/_layout.tsx
import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function ProjectsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Projects' }} />
      <Stack.Screen name="[id]" options={{ title: 'Project' }} />
    </Stack>
  );
}
```

```typescript
// app/(tabs)/settings/_layout.tsx
import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="templates/index" options={{ title: 'Templates' }} />
      <Stack.Screen name="templates/[id]" options={{ title: 'Template' }} />
    </Stack>
  );
}
```

**Step 4: Commit**

```bash
git add app/_layout.tsx app/(tabs)/_layout.tsx app/(tabs)/sessions/_layout.tsx app/(tabs)/projects/_layout.tsx app/(tabs)/settings/_layout.tsx
git commit -m "feat: add root layout and tab navigator"
```

---

### Task 9: Shared Components

**Files:**
- Create: `components/StatusBadge.tsx`
- Create: `components/FilterChips.tsx`
- Create: `components/SessionCard.tsx`
- Create: `components/InputBar.tsx`

**Step 1: StatusBadge**

```typescript
// components/StatusBadge.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { SessionStatus } from '../lib/types';

const STATUS_COLORS: Record<SessionStatus, string> = {
  created: Colors.textMuted,
  running: Colors.success,
  awaiting_approval: Colors.warning,
  paused: Colors.textMuted,
  completed: Colors.primary,
  error: Colors.error,
};

const STATUS_LABELS: Record<SessionStatus, string> = {
  created: 'Created',
  running: 'Running',
  awaiting_approval: 'Awaiting',
  paused: 'Paused',
  completed: 'Completed',
  error: 'Error',
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  const color = STATUS_COLORS[status] || Colors.textMuted;
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
```

**Step 2: FilterChips**

```typescript
// components/FilterChips.tsx
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

interface FilterChipsProps {
  options: { label: string; value: string | null }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.label}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.primary,
  },
});
```

**Step 3: SessionCard**

```typescript
// components/SessionCard.tsx
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBadge } from './StatusBadge';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { SessionSummary } from '../lib/types';

export function SessionCard({ session }: { session: SessionSummary }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/sessions/${session.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{session.name}</Text>
        <StatusBadge status={session.status} />
      </View>
      <Text style={styles.project} numberOfLines={1}>
        {session.project_dir.split('/').pop()}
      </Text>
      {session.last_message_preview && (
        <Text style={styles.preview} numberOfLines={2}>
          {session.last_message_preview}
        </Text>
      )}
      <View style={styles.footer}>
        <Text style={styles.cost}>${session.total_cost_usd.toFixed(2)}</Text>
        <Text style={styles.time}>
          {new Date(session.updated_at).toLocaleTimeString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  project: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  preview: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cost: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  time: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
```

**Step 4: InputBar**

```typescript
// components/InputBar.tsx
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

interface InputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputBar({ onSend, disabled, placeholder }: InputBarProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder || 'Type a message...'}
        placeholderTextColor={Colors.textMuted}
        multiline
        maxLength={10000}
        editable={!disabled}
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[styles.sendButton, (!text.trim() || disabled) && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || disabled}
      >
        <Ionicons
          name="send"
          size={20}
          color={text.trim() && !disabled ? Colors.primary : Colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.md,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
```

**Step 5: Commit**

```bash
git add components/StatusBadge.tsx components/FilterChips.tsx components/SessionCard.tsx components/InputBar.tsx
git commit -m "feat: add shared UI components"
```

---

### Task 10: Message Card Components

**Files:**
- Create: `components/MessageCard.tsx`
- Create: `components/AssistantTextCard.tsx`
- Create: `components/ToolUseCard.tsx`
- Create: `components/ToolResultCard.tsx`
- Create: `components/ApprovalCard.tsx`
- Create: `components/ErrorCard.tsx`

**Step 1: MessageCard (router)**

```typescript
// components/MessageCard.tsx
import type { WSMessageData } from '../lib/types';
import { AssistantTextCard } from './AssistantTextCard';
import { ToolUseCard } from './ToolUseCard';
import { ToolResultCard } from './ToolResultCard';
import { ApprovalCard } from './ApprovalCard';
import { ErrorCard } from './ErrorCard';

interface Props {
  message: WSMessageData;
  sessionId: string;
}

export function MessageCard({ message, sessionId }: Props) {
  switch (message.type) {
    case 'assistant_text':
      return <AssistantTextCard text={message.data.text} />;
    case 'tool_use':
      return (
        <ToolUseCard
          toolName={message.data.tool_name}
          toolInput={message.data.tool_input}
        />
      );
    case 'tool_result':
      return (
        <ToolResultCard
          output={message.data.output}
          isError={message.data.is_error}
        />
      );
    case 'approval_request':
      return (
        <ApprovalCard
          sessionId={sessionId}
          toolName={message.data.tool_name}
          toolInput={message.data.tool_input}
          description={message.data.description}
        />
      );
    case 'error':
      return <ErrorCard message={message.data.message || 'Unknown error'} />;
    default:
      return null;
  }
}
```

**Step 2: AssistantTextCard**

```typescript
// components/AssistantTextCard.tsx
import { View, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily } from '../constants/theme';

export function AssistantTextCard({ text }: { text: string }) {
  return (
    <View style={styles.card}>
      <Markdown
        style={{
          body: { color: Colors.text, fontSize: FontSize.md },
          code_inline: {
            backgroundColor: Colors.background,
            color: Colors.primary,
            fontFamily: FontFamily.mono,
            fontSize: FontSize.sm,
          },
          fence: {
            backgroundColor: Colors.background,
            color: Colors.text,
            fontFamily: FontFamily.mono,
            fontSize: FontSize.sm,
            padding: Spacing.md,
            borderRadius: BorderRadius.sm,
          },
          link: { color: Colors.primary },
          heading1: { color: Colors.text, fontWeight: '700' },
          heading2: { color: Colors.text, fontWeight: '700' },
          heading3: { color: Colors.text, fontWeight: '600' },
        }}
      >
        {text}
      </Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
```

**Step 3: ToolUseCard**

```typescript
// components/ToolUseCard.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, FontFamily } from '../constants/theme';

interface Props {
  toolName: string;
  toolInput: Record<string, any>;
}

export function ToolUseCard({ toolName, toolInput }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Ionicons name="build" size={16} color={Colors.primary} />
        <Text style={styles.toolName}>{toolName}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textMuted}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.body}>
          <Text style={styles.code}>
            {JSON.stringify(toolInput, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  toolName: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  body: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  code: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
```

**Step 4: ToolResultCard**

```typescript
// components/ToolResultCard.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, FontFamily } from '../constants/theme';

interface Props {
  output: string;
  isError?: boolean;
}

export function ToolResultCard({ output, isError }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = isError ? Colors.error : Colors.success;

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isError ? 'close-circle' : 'checkmark-circle'}
          size={16}
          color={color}
        />
        <Text style={[styles.label, { color }]}>
          {isError ? 'Error' : 'Result'}
        </Text>
        <Text style={styles.preview} numberOfLines={1}>
          {output.slice(0, 80)}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textMuted}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.body}>
          <Text style={styles.code} selectable>{output}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  preview: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  body: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  code: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
```

**Step 5: ApprovalCard**

```typescript
// components/ApprovalCard.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApproveToolUse, useDenyToolUse } from '../lib/api';
import { Colors, FontSize, Spacing, BorderRadius, FontFamily } from '../constants/theme';

interface Props {
  sessionId: string;
  toolName: string;
  toolInput: Record<string, any>;
  description: string;
}

export function ApprovalCard({ sessionId, toolName, toolInput, description }: Props) {
  const approve = useApproveToolUse(sessionId);
  const deny = useDenyToolUse(sessionId);

  const handleApprove = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    approve.mutate();
  };

  const handleDeny = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deny.mutate();
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={20} color={Colors.warning} />
        <Text style={styles.title}>Approval Required</Text>
      </View>
      <Text style={styles.toolName}>{toolName}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      <View style={styles.inputPreview}>
        <Text style={styles.code} numberOfLines={10}>
          {JSON.stringify(toolInput, null, 2)}
        </Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.denyButton]}
          onPress={handleDeny}
          disabled={deny.isPending}
        >
          <Ionicons name="close" size={18} color={Colors.error} />
          <Text style={[styles.buttonText, { color: Colors.error }]}>Deny</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={handleApprove}
          disabled={approve.isPending}
        >
          <Ionicons name="checkmark" size={18} color={Colors.background} />
          <Text style={[styles.buttonText, { color: Colors.background }]}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.warning,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.warning,
  },
  toolName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  inputPreview: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  code: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  denyButton: {
    borderWidth: 1,
    borderColor: Colors.error,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
```

**Step 6: ErrorCard**

```typescript
// components/ErrorCard.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

export function ErrorCard({ message }: { message: string }) {
  return (
    <View style={styles.card}>
      <Ionicons name="alert-circle" size={18} color={Colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  text: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.error,
  },
});
```

**Step 7: Commit**

```bash
git add components/MessageCard.tsx components/AssistantTextCard.tsx components/ToolUseCard.tsx components/ToolResultCard.tsx components/ApprovalCard.tsx components/ErrorCard.tsx
git commit -m "feat: add message card components for structured rendering"
```

---

### Task 11: Session List Screen

**Files:**
- Create: `app/(tabs)/sessions/index.tsx`

**Step 1: Implement session list**

```typescript
// app/(tabs)/sessions/index.tsx
import { useState } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionsList } from '../../../lib/api';
import { SessionCard } from '../../../components/SessionCard';
import { FilterChips } from '../../../components/FilterChips';
import { Colors, FontSize, Spacing } from '../../../constants/theme';
import type { SessionStatus } from '../../../lib/types';

const FILTERS = [
  { label: 'All', value: null },
  { label: 'Running', value: 'running' },
  { label: 'Awaiting', value: 'awaiting_approval' },
  { label: 'Completed', value: 'completed' },
];

export default function SessionListScreen() {
  const [filter, setFilter] = useState<string | null>(null);
  const { data: sessions, isLoading, refetch } = useSessionsList(
    filter as SessionStatus | undefined
  );

  return (
    <View style={styles.container}>
      <FilterChips options={FILTERS} selected={filter} onSelect={setFilter} />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : !sessions?.length ? (
        <View style={styles.empty}>
          <Ionicons name="terminal-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No sessions yet</Text>
          <Text style={styles.emptyHint}>Create a session to get started</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => <SessionCard session={item} />}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingVertical: Spacing.sm }}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/sessions/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyText: { fontSize: FontSize.lg, color: Colors.textMuted, fontWeight: '600' },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/sessions/index.tsx
git commit -m "feat: add session list screen"
```

---

### Task 12: Create Session Screen

**Files:**
- Create: `app/(tabs)/sessions/create.tsx`

**Step 1: Implement create session form**

```typescript
// app/(tabs)/sessions/create.tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCreateSession, useProjectsList, useTemplatesList } from '../../../lib/api';
import { Colors, FontSize, Spacing, BorderRadius } from '../../../constants/theme';

export default function CreateSessionScreen() {
  const [name, setName] = useState('');
  const [projectDir, setProjectDir] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const createSession = useCreateSession();
  const { data: projects } = useProjectsList();
  const { data: templates } = useTemplatesList();

  const handleCreate = () => {
    if (!name.trim() || !projectDir.trim() || !prompt.trim()) {
      Alert.alert('Missing Fields', 'Name, project, and prompt are required.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createSession.mutate(
      {
        name: name.trim(),
        project_dir: projectDir.trim(),
        initial_prompt: prompt.trim(),
        template_id: selectedTemplate || undefined,
      },
      {
        onSuccess: (session) => {
          router.replace(`/(tabs)/sessions/${session.id}`);
        },
        onError: (err) => {
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create session');
        },
      }
    );
  };

  const applyTemplate = (templateId: string) => {
    const t = templates?.find((t) => t.id === templateId);
    if (t) {
      setSelectedTemplate(templateId);
      if (t.project_dir) setProjectDir(t.project_dir);
      if (t.initial_prompt) setPrompt(t.initial_prompt);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Session Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., fix-auth-bug"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Project Directory</Text>
      {projects && projects.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectPicker}>
          {projects.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.projectChip,
                projectDir === p.path && styles.projectChipActive,
              ]}
              onPress={() => setProjectDir(p.path)}
            >
              <Text
                style={[
                  styles.projectChipText,
                  projectDir === p.path && styles.projectChipTextActive,
                ]}
              >
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <TextInput
        style={styles.input}
        value={projectDir}
        onChangeText={setProjectDir}
        placeholder="/path/to/project"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
      />

      {templates && templates.length > 0 && (
        <>
          <Text style={styles.label}>Template (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectPicker}>
            {templates.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.projectChip,
                  selectedTemplate === t.id && styles.projectChipActive,
                ]}
                onPress={() => applyTemplate(t.id)}
              >
                <Text
                  style={[
                    styles.projectChipText,
                    selectedTemplate === t.id && styles.projectChipTextActive,
                  ]}
                >
                  {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={styles.label}>Prompt</Text>
      <TextInput
        style={[styles.input, styles.promptInput]}
        value={prompt}
        onChangeText={setPrompt}
        placeholder="What should Claude work on?"
        placeholderTextColor={Colors.textMuted}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.createButton, createSession.isPending && { opacity: 0.6 }]}
        onPress={handleCreate}
        disabled={createSession.isPending}
        activeOpacity={0.8}
      >
        {createSession.isPending ? (
          <ActivityIndicator color={Colors.text} />
        ) : (
          <Text style={styles.createButtonText}>Create Session</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl * 2 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginTop: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  promptInput: { minHeight: 120, paddingTop: Spacing.md },
  projectPicker: { marginBottom: Spacing.sm },
  projectChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    marginRight: Spacing.sm,
  },
  projectChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  projectChipText: { fontSize: FontSize.sm, color: Colors.textMuted },
  projectChipTextActive: { color: Colors.primary },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  createButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
});
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/sessions/create.tsx
git commit -m "feat: add create session screen"
```

---

### Task 13: Session Detail Screen

**Files:**
- Create: `app/(tabs)/sessions/[id].tsx`

**Step 1: Implement session detail**

```typescript
// app/(tabs)/sessions/[id].tsx
import { useEffect, useRef } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession, usePauseSession } from '../../../lib/api';
import { useSessionStream } from '../../../lib/websocket';
import { useAppStore } from '../../../lib/store';
import { MessageCard } from '../../../components/MessageCard';
import { InputBar } from '../../../components/InputBar';
import { StatusBadge } from '../../../components/StatusBadge';
import { useSendPrompt } from '../../../lib/api';
import { Colors, FontSize, Spacing } from '../../../constants/theme';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading } = useSession(id);
  const { messages, isConnected } = useSessionStream(id);
  const sendPrompt = useSendPrompt(id);
  const pauseSession = usePauseSession(id);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  if (isLoading || !session) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const isActive = session.status === 'running' || session.status === 'awaiting_approval';
  const canSend = session.status === 'running' || session.status === 'paused';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: session.name,
          headerRight: () => (
            <View style={styles.headerRight}>
              <StatusBadge status={session.status} />
              {isActive && (
                <TouchableOpacity onPress={() => pauseSession.mutate()}>
                  <Ionicons name="pause-circle" size={24} color={Colors.warning} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {session.project_dir.split('/').pop()} | ${session.total_cost_usd.toFixed(2)}
        </Text>
        <View style={[styles.connDot, { backgroundColor: isConnected ? Colors.success : Colors.error }]} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <MessageCard message={item} sessionId={id} />}
        contentContainerStyle={{ paddingVertical: Spacing.sm }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isActive ? 'Waiting for output...' : 'No messages yet'}
            </Text>
          </View>
        }
      />

      {canSend && (
        <InputBar
          onSend={(text) => sendPrompt.mutate(text)}
          disabled={sendPrompt.isPending}
          placeholder="Send a follow-up prompt..."
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  infoText: { fontSize: FontSize.xs, color: Colors.textMuted },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  empty: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/sessions/\[id\].tsx
git commit -m "feat: add session detail screen with live streaming"
```

---

### Task 14: Projects Screens

**Files:**
- Create: `app/(tabs)/projects/index.tsx`
- Create: `app/(tabs)/projects/[id].tsx`
- Create: `components/ProjectCard.tsx`

**Step 1: ProjectCard**

```typescript
// components/ProjectCard.tsx
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { Project, ProjectType } from '../lib/types';

const TYPE_ICONS: Record<ProjectType, string> = {
  python: 'logo-python',
  node: 'logo-nodejs',
  rust: 'hardware-chip',
  go: 'code-slash',
  unknown: 'folder',
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/projects/${project.id}?path=${encodeURIComponent(project.path)}`)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={(TYPE_ICONS[project.type] || 'folder') as any}
        size={24}
        color={Colors.primary}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{project.name}</Text>
        <Text style={styles.path} numberOfLines={1}>{project.path}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  path: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});
```

**Step 2: Project list screen**

```typescript
// app/(tabs)/projects/index.tsx
import { View, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProjectsList } from '../../../lib/api';
import { ProjectCard } from '../../../components/ProjectCard';
import { Colors, FontSize, Spacing } from '../../../constants/theme';

export default function ProjectListScreen() {
  const { data: projects, isLoading, refetch } = useProjectsList();

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      ) : !projects?.length ? (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No projects found</Text>
          <Text style={styles.emptyHint}>Configure scan directories in Settings</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <ProjectCard project={item} />}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingVertical: Spacing.sm }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyText: { fontSize: FontSize.lg, color: Colors.textMuted, fontWeight: '600' },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted },
});
```

**Step 3: Project detail screen**

```typescript
// app/(tabs)/projects/[id].tsx
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionsList } from '../../../lib/api';
import { SessionCard } from '../../../components/SessionCard';
import { Colors, FontSize, Spacing } from '../../../constants/theme';

export default function ProjectDetailScreen() {
  const { id, path } = useLocalSearchParams<{ id: string; path: string }>();
  const decodedPath = path ? decodeURIComponent(path) : '';
  const projectName = decodedPath.split('/').pop() || 'Project';
  const { data: sessions } = useSessionsList();

  const projectSessions = sessions?.filter((s) => s.project_dir === decodedPath) || [];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: projectName }} />
      <View style={styles.header}>
        <Text style={styles.path}>{decodedPath}</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push(`/(tabs)/sessions/create?projectDir=${encodeURIComponent(decodedPath)}`)}
        >
          <Ionicons name="add-circle" size={20} color={Colors.primary} />
          <Text style={styles.newButtonText}>New Session</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={projectSessions}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <SessionCard session={item} />}
        contentContainerStyle={{ paddingVertical: Spacing.sm }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No sessions for this project</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  path: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  newButtonText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600' },
  empty: { padding: Spacing.xxl, alignItems: 'center' },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
```

**Step 4: Commit**

```bash
git add components/ProjectCard.tsx app/\(tabs\)/projects/index.tsx app/\(tabs\)/projects/\[id\].tsx
git commit -m "feat: add project list and detail screens"
```

---

### Task 15: Settings Screen

**Files:**
- Create: `app/(tabs)/settings/index.tsx`

**Step 1: Implement settings**

```typescript
// app/(tabs)/settings/index.tsx
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../../lib/store';
import { useServerStatus, usePushSettings, useUpdatePushSettings } from '../../../lib/api';
import { Colors, FontSize, Spacing, BorderRadius } from '../../../constants/theme';

export default function SettingsScreen() {
  const hostConfig = useAppStore((s) => s.hostConfig);
  const setHostConfig = useAppStore((s) => s.setHostConfig);
  const { data: serverStatus } = useServerStatus();
  const { data: pushSettings } = usePushSettings();
  const updatePush = useUpdatePushSettings();

  return (
    <ScrollView style={styles.container}>
      {/* Host Connection */}
      <Text style={styles.sectionTitle}>Host Connection</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Tailscale Address</Text>
        <TextInput
          style={styles.input}
          value={hostConfig.address}
          onChangeText={(v) => setHostConfig({ ...hostConfig, address: v })}
          placeholder="e.g., macbook.tailnet-xxxx or 100.x.y.z"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.label}>Port</Text>
        <TextInput
          style={styles.input}
          value={String(hostConfig.port)}
          onChangeText={(v) => setHostConfig({ ...hostConfig, port: parseInt(v) || 8080 })}
          keyboardType="number-pad"
          placeholderTextColor={Colors.textMuted}
        />
        {serverStatus && (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.statusText}>
              Connected | {serverStatus.active_sessions} active / {serverStatus.total_sessions} total
            </Text>
          </View>
        )}
      </View>

      {/* Templates */}
      <Text style={styles.sectionTitle}>Templates</Text>
      <TouchableOpacity
        style={styles.navRow}
        onPress={() => router.push('/(tabs)/settings/templates')}
      >
        <Ionicons name="document-text" size={20} color={Colors.primary} />
        <Text style={styles.navRowText}>Manage Templates</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.section}>
        {pushSettings && (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Approval Requests</Text>
              <Switch
                value={pushSettings.notify_approvals}
                onValueChange={(v) =>
                  updatePush.mutate({ ...pushSettings, notify_approvals: v })
                }
                trackColor={{ true: Colors.primary }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Session Completions</Text>
              <Switch
                value={pushSettings.notify_completions}
                onValueChange={(v) =>
                  updatePush.mutate({ ...pushSettings, notify_completions: v })
                }
                trackColor={{ true: Colors.primary }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Session Errors</Text>
              <Switch
                value={pushSettings.notify_errors}
                onValueChange={(v) =>
                  updatePush.mutate({ ...pushSettings, notify_errors: v })
                }
                trackColor={{ true: Colors.primary }}
              />
            </View>
          </>
        )}
      </View>

      <View style={{ height: Spacing.xxl * 2 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FontSize.sm, color: Colors.success },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  navRowText: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  switchLabel: { fontSize: FontSize.md, color: Colors.text },
});
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/settings/index.tsx
git commit -m "feat: add settings screen"
```

---

### Task 16: Template Management Screens

**Files:**
- Create: `components/TemplateCard.tsx`
- Create: `app/(tabs)/settings/templates/index.tsx`
- Create: `app/(tabs)/settings/templates/[id].tsx`

**Step 1: TemplateCard**

```typescript
// components/TemplateCard.tsx
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { Template } from '../lib/types';

export function TemplateCard({ template }: { template: Template }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/settings/templates/${template.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.info}>
        <Text style={styles.name}>{template.name}</Text>
        <Text style={styles.prompt} numberOfLines={2}>{template.initial_prompt}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  info: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  prompt: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
});
```

**Step 2: Template list and editor screens**

Create `app/(tabs)/settings/templates/index.tsx` with a FlatList of TemplateCards, a "New Template" button, and pull-to-refresh.

Create `app/(tabs)/settings/templates/[id].tsx` with a form for editing template fields (name, project_dir, initial_prompt, model, budget_cap) and save/delete buttons. For a new template, use `id=new`.

These follow the same patterns as the session list/create screens — use the same styling constants and layout patterns.

**Step 3: Commit**

```bash
git add components/TemplateCard.tsx app/\(tabs\)/settings/templates/
git commit -m "feat: add template management screens"
```

---

### Task 17: Final Cleanup & Verification

**Step 1: Remove scaffolded template files**

Delete any default files from `create-expo-app` that were replaced (e.g., `app/index.tsx`, default components).

**Step 2: Run TypeScript check**

```bash
cd /Users/gldc/Developer/claude-code-remote-app && npx tsc --noEmit
```

Fix any type errors.

**Step 3: Run the app**

```bash
npx expo start --ios
```

Verify:
- All three tabs render
- Empty states show correctly
- Settings tab allows entering host address
- Navigation between screens works

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: cleanup scaffolding and verify build"
```
