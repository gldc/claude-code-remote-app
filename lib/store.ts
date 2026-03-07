import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WSMessageData } from './types';

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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hostConfig: state.hostConfig,
      }),
    }
  )
);
