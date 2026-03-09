"use dom";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface Props {
  wsUrl: string;
  sendKey: string;
  theme: "light" | "dark";
  dom: import("expo/dom").DOMProps;
}

const THEMES = {
  light: {
    background: "#2D2A26",
    foreground: "#E8DDD0",
    cursor: "#E8DDD0",
    selectionBackground: "#4A4540",
    black: "#2D2A26",
    red: "#CF222E",
    green: "#2D8A4E",
    yellow: "#BF8700",
    blue: "#74c0fc",
    magenta: "#cc5de8",
    cyan: "#66d9e8",
    white: "#E8DDD0",
    brightBlack: "#7C7268",
    brightRed: "#ff6b6b",
    brightGreen: "#51cf66",
    brightYellow: "#ffd43b",
    brightBlue: "#91d5ff",
    brightMagenta: "#da77f2",
    brightCyan: "#99e9f2",
    brightWhite: "#ffffff",
  },
  dark: {
    background: "#141210",
    foreground: "#E8DDD0",
    cursor: "#E8DDD0",
    selectionBackground: "#3D3935",
    black: "#141210",
    red: "#E5534B",
    green: "#3DA665",
    yellow: "#D4A017",
    blue: "#74c0fc",
    magenta: "#cc5de8",
    cyan: "#66d9e8",
    white: "#E8DDD0",
    brightBlack: "#7C7268",
    brightRed: "#ff8787",
    brightGreen: "#69db7c",
    brightYellow: "#ffe066",
    brightBlue: "#91d5ff",
    brightMagenta: "#da77f2",
    brightCyan: "#99e9f2",
    brightWhite: "#ffffff",
  },
};

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];

export default function TerminalView({ wsUrl, sendKey, theme }: Props) {
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const closedIntentionallyRef = useRef(false);

  // Handle key events from native toolbar
  useEffect(() => {
    if (sendKey && terminalRef.current) {
      const separatorIndex = sendKey.lastIndexOf("|");
      const keyValue = separatorIndex > 0 ? sendKey.substring(0, separatorIndex) : sendKey;
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN && keyValue) {
        ws.send(JSON.stringify({ type: "input", data: keyValue }));
      }
    }
  }, [sendKey]);

  useEffect(() => {
    if (!termRef.current) return;

    const xtermTheme = THEMES[theme] || THEMES.dark;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      theme: xtermTheme,
      allowTransparency: false,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    terminalRef.current = term;
    term.open(termRef.current);
    fitAddon.fit();

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        const { cols, rows } = term;
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          term.write(new Uint8Array(event.data));
        } else {
          term.write(event.data);
        }
      };

      ws.onclose = (event) => {
        if (closedIntentionallyRef.current) return;

        // Code 1000 with "Terminal exited" = PTY process died (user typed exit, etc.)
        if (event.code === 1000 && event.reason === "Terminal exited") {
          term.write("\r\n\x1b[33m[Terminal session ended. Press any key to restart.]\x1b[0m\r\n");
          // Wait for any keypress, then reconnect (spawns fresh PTY)
          const disposable = term.onData(() => {
            disposable.dispose();
            reconnectAttemptRef.current = 0;
            connect();
          });
          return;
        }

        // Otherwise: unexpected disconnect — auto-reconnect with backoff
        const attempt = reconnectAttemptRef.current;
        const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
        term.write(`\r\n\x1b[33m[Disconnected. Reconnecting in ${delay / 1000}s...]\x1b[0m\r\n`);
        reconnectAttemptRef.current = attempt + 1;
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // onerror is always followed by onclose, reconnection happens there
      };

      // Forward keystrokes to server
      term.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "input", data }));
        }
      });
    }

    connect();

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        const { cols, rows } = term;
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(termRef.current);
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      closedIntentionallyRef.current = true;
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      const ws = wsRef.current;
      if (ws) ws.close();
      term.dispose();
    };
  }, [wsUrl, theme]);

  const bg = (THEMES[theme] || THEMES.dark).background;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: bg,
        overflow: "hidden",
      }}
    >
      <div ref={termRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
