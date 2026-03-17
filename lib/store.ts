import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { NativeEvent } from './types';

const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface HostConfig {
  address: string;
  port: number;
}

interface AppState {
  hostConfig: HostConfig;
  setHostConfig: (config: HostConfig) => void;
  getBaseUrl: () => string;

  sessionMessages: Record<string, NativeEvent[]>;
  appendMessage: (sessionId: string, message: NativeEvent) => void;
  setMessages: (sessionId: string, messages: NativeEvent[]) => void;
  clearMessages: (sessionId: string) => void;

  pendingSkillInsert: string | null;
  setPendingSkillInsert: (skill: string | null) => void;

  hasOnboarded: boolean;
  setHasOnboarded: (value: boolean) => void;

  pendingCreateSession: boolean;
  setPendingCreateSession: (value: boolean) => void;
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

      pendingSkillInsert: null,
      setPendingSkillInsert: (skill) => set({ pendingSkillInsert: skill }),

      hasOnboarded: false,
      setHasOnboarded: (value) => set({ hasOnboarded: value }),

      pendingCreateSession: false,
      setPendingCreateSession: (value) => set({ pendingCreateSession: value }),
    }),
    {
      name: 'claude-code-remote-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        hostConfig: state.hostConfig,
        hasOnboarded: state.hasOnboarded,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.hostConfig.address && !state.hasOnboarded) {
          state.setHasOnboarded(true);
        }
      },
    }
  )
);
