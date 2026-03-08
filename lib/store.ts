import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { WSMessageData } from './types';

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
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        hostConfig: state.hostConfig,
      }),
    }
  )
);
