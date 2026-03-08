import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useAppStore } from './store';
import type { WSMessageData, WSMessageType } from './types';

const VALID_WS_MESSAGE_TYPES: Set<string> = new Set<string>([
  'assistant_text',
  'user_message',
  'tool_use',
  'tool_result',
  'status_change',
  'approval_request',
  'error',
  'rate_limit',
  'cost_update',
  'ping',
]);

function isValidWSMessage(msg: unknown): msg is WSMessageData {
  if (msg === null || typeof msg !== 'object') return false;
  const obj = msg as Record<string, unknown>;
  if (typeof obj.type !== 'string' || !VALID_WS_MESSAGE_TYPES.has(obj.type)) return false;
  if (obj.type !== 'ping' && (obj.data === null || typeof obj.data !== 'object')) return false;
  return true;
}

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
        const parsed: unknown = JSON.parse(event.data);
        if (!isValidWSMessage(parsed)) {
          console.warn('[WS] Dropping invalid message:', event.data);
          return;
        }
        if (parsed.type === 'ping') return;
        appendMessage(sessionId, parsed);
      } catch {
        console.warn('[WS] Failed to parse message:', event.data);
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
