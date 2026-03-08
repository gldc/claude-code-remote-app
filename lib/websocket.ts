import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useAppStore } from './store';
import type { WSMessageData } from './types';

const EMPTY_MESSAGES: WSMessageData[] = [];

export function useSessionStream(sessionId: string | null) {
  const hostConfig = useAppStore((s) => s.hostConfig);
  const appendMessage = useAppStore((s) => s.appendMessage);
  const setMessages = useAppStore((s) => s.setMessages);
  const sessionMessages = useAppStore((s) => s.sessionMessages);
  const messages = sessionId ? sessionMessages[sessionId] ?? EMPTY_MESSAGES : EMPTY_MESSAGES;

  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (!sessionId || !hostConfig.address || unmountedRef.current) return;

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
      if (!unmountedRef.current) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sessionId, hostConfig.address, hostConfig.port, appendMessage]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
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
