import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from './store';
import type { NativeEvent } from './types';

const VALID_EVENT_TYPES = new Set([
  'assistant', 'tool_result', 'user', 'result',
  'rate_limit_event', 'approval_request', 'error', 'ping',
  // Legacy types (pre-migration sessions)
  'assistant_text', 'user_message', 'tool_use', 'status_change',
  'rate_limit', 'cost_update', 'bash_output',
]);

function isValidEvent(data: unknown): data is NativeEvent {
  if (data === null || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.type === 'string' && VALID_EVENT_TYPES.has(obj.type);
}

const EMPTY_MESSAGES: NativeEvent[] = [];

// Batch backfill messages arriving within this window (ms) after connect
const BACKFILL_WINDOW_MS = 200;

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

  // Backfill buffering: collect messages arriving right after connect, flush as batch
  const backfillBuffer = useRef<NativeEvent[]>([]);
  const backfillTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isBackfilling = useRef(false);

  const flushBackfill = useCallback(() => {
    if (!sessionId || backfillBuffer.current.length === 0) return;
    setMessages(sessionId, backfillBuffer.current);
    backfillBuffer.current = [];
    isBackfilling.current = false;
  }, [sessionId, setMessages]);

  const connect = useCallback(() => {
    if (!sessionId || !hostConfig.address || unmountedRef.current) return;

    const wsUrl = `ws://${hostConfig.address}:${hostConfig.port}/ws/sessions/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Start backfill window — messages arriving quickly after connect are batched
      isBackfilling.current = true;
      backfillBuffer.current = [];
      backfillTimer.current = setTimeout(() => {
        flushBackfill();
      }, BACKFILL_WINDOW_MS);
    };

    ws.onmessage = (event) => {
      try {
        const parsed: unknown = JSON.parse(event.data);
        if (!isValidEvent(parsed)) return;
        if (parsed.type === 'ping') return;

        if (isBackfilling.current) {
          // Buffer during backfill window
          backfillBuffer.current.push(parsed);
        } else {
          // Live message — append immediately
          appendMessage(sessionId, parsed);
        }
      } catch {
        // Ignore parse failures
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      // Flush any remaining backfill on disconnect
      if (isBackfilling.current) {
        if (backfillTimer.current) clearTimeout(backfillTimer.current);
        flushBackfill();
      }
      // 4003 = unauthorized, 4004 = session not found — do not reconnect
      if (event.code === 4003 || event.code === 4004) {
        if (sessionId) {
          appendMessage(sessionId, {
            type: 'error',
            error: 'Access denied: unauthorized WebSocket connection (4003).',
            timestamp: new Date().toISOString(),
          } as NativeEvent);
        }
        return;
      }
      if (!unmountedRef.current) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sessionId, hostConfig.address, hostConfig.port, appendMessage, flushBackfill]);

  useEffect(() => {
    unmountedRef.current = false;
    if (sessionId) {
      const clearMessages = useAppStore.getState().clearMessages;
      clearMessages(sessionId);
    }
    connect();
    return () => {
      unmountedRef.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (backfillTimer.current) clearTimeout(backfillTimer.current);
      if (isBackfilling.current) flushBackfill();
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
