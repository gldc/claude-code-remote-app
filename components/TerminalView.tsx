"use dom";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { AnsiColorsLight, AnsiColorsDark, type AnsiPalette } from "../constants/ansiColors";

interface Props {
  wsUrl: string;
  sendKey: string;
  copyTrigger: string;
  ctrlActive: boolean;
  onCtrlConsumed: () => void;
  onOpenUrl: (url: string) => void;
  onCopyText: (text: string) => void;
  onSelectionChange: (hasSelection: boolean) => void;
  theme: "light" | "dark";
  dom: import("expo/dom").DOMProps;
}

function buildXtermTheme(ansi: AnsiPalette, bg: string, fg: string, cursor: string) {
  return {
    background: bg, foreground: fg, cursor,
    black: ansi.black, red: ansi.red, green: ansi.green, yellow: ansi.yellow,
    blue: ansi.blue, magenta: ansi.magenta, cyan: ansi.cyan, white: ansi.white,
    brightBlack: ansi.brightBlack, brightRed: ansi.brightRed, brightGreen: ansi.brightGreen,
    brightYellow: ansi.brightYellow, brightBlue: ansi.brightBlue, brightMagenta: ansi.brightMagenta,
    brightCyan: ansi.brightCyan, brightWhite: ansi.brightWhite,
  };
}

const THEMES = {
  light: buildXtermTheme(AnsiColorsLight, "#2D2A26", "#E8DDD0", "#E8DDD0"),
  dark: buildXtermTheme(AnsiColorsDark, "#141210", "#E8DDD0", "#E8DDD0"),
};

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];

export default function TerminalView({ wsUrl, sendKey, copyTrigger, ctrlActive, onCtrlConsumed, onOpenUrl, onCopyText, onSelectionChange, theme }: Props) {
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const closedIntentionallyRef = useRef(false);
  const ctrlActiveRef = useRef(ctrlActive);
  const onOpenUrlRef = useRef(onOpenUrl);
  const onCopyTextRef = useRef(onCopyText);
  const onSelectionChangeRef = useRef(onSelectionChange);

  // Keep refs in sync with props so closures always call the latest version
  useEffect(() => { ctrlActiveRef.current = ctrlActive; }, [ctrlActive]);
  useEffect(() => { onOpenUrlRef.current = onOpenUrl; }, [onOpenUrl]);
  useEffect(() => { onCopyTextRef.current = onCopyText; }, [onCopyText]);
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange; }, [onSelectionChange]);

  // Handle copy trigger from native toolbar
  useEffect(() => {
    if (copyTrigger && terminalRef.current) {
      const selection = terminalRef.current.getSelection();
      if (selection) {
        onCopyTextRef.current(selection);
      }
    }
  }, [copyTrigger]);

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

    const webLinksAddon = new WebLinksAddon((_event, url) => {
      onOpenUrlRef.current(url);
    });
    term.loadAddon(webLinksAddon);

    terminalRef.current = term;
    term.open(termRef.current);
    fitAddon.fit();

    // Notify native side when selection changes
    term.onSelectionChange(() => {
      const selection = term.getSelection();
      onSelectionChangeRef.current(selection.length > 0);
    });

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

      // Forward keystrokes to server, applying Ctrl modifier when active
      term.onData((data: string) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        let payload = data;
        if (ctrlActiveRef.current && data.length === 1 && /[a-zA-Z]/.test(data)) {
          payload = String.fromCharCode(data.toUpperCase().charCodeAt(0) - 64);
          onCtrlConsumed();
        }
        ws.send(JSON.stringify({ type: "input", data: payload }));
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
