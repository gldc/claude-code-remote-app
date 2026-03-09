# Terminal App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full interactive terminal to the Projects tab using an Expo DOM component with xterm.js, including a native key toolbar for mobile-friendly input.

**Architecture:** A `"use dom"` component renders xterm.js in a WebView (iOS/Android) or directly in the DOM (web). It connects to the CCR server's `/ws/terminal/{project_id}` WebSocket endpoint. A native key toolbar provides Tab, Ctrl, Esc, and arrow keys. Terminal icon in the project detail header navigates to the terminal screen.

**Tech Stack:** Expo SDK 54, Expo Router, xterm.js, @xterm/addon-fit, Expo DOM components (`"use dom"`)

---

### Task 1: Install xterm.js dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

```bash
npm install xterm @xterm/addon-fit
```

**Step 2: Verify install**

Run: `npx expo doctor` or `npm ls xterm`

Expected: Packages installed successfully.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add xterm and @xterm/addon-fit dependencies"
```

---

### Task 2: Create the TerminalView DOM component

**Files:**
- Create: `components/TerminalView.tsx`

**Step 1: Write the DOM component**

```tsx
"use dom";

import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";

interface Props {
  wsUrl: string;
  sendKey: string;
  onClose: () => Promise<void>;
  dom: import("expo/dom").DOMProps;
}

export default function TerminalView({ wsUrl, sendKey, onClose }: Props) {
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Handle key events from native toolbar
  useEffect(() => {
    if (sendKey && terminalRef.current) {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data: sendKey }));
      }
    }
  }, [sendKey]);

  useEffect(() => {
    if (!termRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      theme: {
        background: "#1a1a2e",
        foreground: "#e0e0e0",
        cursor: "#e0e0e0",
        selectionBackground: "#3a3a5e",
        black: "#1a1a2e",
        red: "#ff6b6b",
        green: "#51cf66",
        yellow: "#ffd43b",
        blue: "#74c0fc",
        magenta: "#cc5de8",
        cyan: "#66d9e8",
        white: "#e0e0e0",
        brightBlack: "#555",
        brightRed: "#ff8787",
        brightGreen: "#69db7c",
        brightYellow: "#ffe066",
        brightBlue: "#91d5ff",
        brightMagenta: "#da77f2",
        brightCyan: "#99e9f2",
        brightWhite: "#ffffff",
      },
      allowTransparency: false,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    term.open(termRef.current);
    fitAddon.fit();

    // Connect WebSocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      // Send initial size
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

    ws.onclose = () => {
      term.write("\r\n\x1b[33m[Terminal session ended]\x1b[0m\r\n");
    };

    ws.onerror = () => {
      term.write("\r\n\x1b[31m[Connection error. Retrying...]\x1b[0m\r\n");
    };

    // Forward keystrokes to server
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        const { cols, rows } = term;
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(termRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [wsUrl]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#1a1a2e",
        overflow: "hidden",
      }}
    >
      <div ref={termRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/TerminalView.tsx
git commit -m "feat: add TerminalView DOM component with xterm.js and WebSocket"
```

---

### Task 3: Create the terminal screen

**Files:**
- Create: `app/(tabs)/projects/terminal.tsx`

**Step 1: Write the terminal screen with key toolbar**

```tsx
import { useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useAppStore } from "../../../lib/store";
import { useColors, type ColorPalette, FontSize, Spacing } from "../../../constants/theme";
import TerminalView from "../../../components/TerminalView";

const TOOLBAR_KEYS = [
  { label: "Esc", value: "\x1b" },
  { label: "Tab", value: "\t" },
  { label: "Ctrl", value: null }, // modifier toggle
  { label: "\u2191", value: "\x1b[A" },
  { label: "\u2193", value: "\x1b[B" },
  { label: "\u2190", value: "\x1b[D" },
  { label: "\u2192", value: "\x1b[C" },
];

export default function TerminalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hostConfig } = useAppStore();
  const colors = useColors();
  const [ctrlActive, setCtrlActive] = useState(false);
  const [sendKey, setSendKey] = useState("");

  const wsUrl = `ws://${hostConfig.address}:${hostConfig.port}/ws/terminal/${id}`;

  const handleKeyPress = useCallback(
    (key: typeof TOOLBAR_KEYS[number]) => {
      if (key.label === "Ctrl") {
        setCtrlActive((prev) => !prev);
        return;
      }

      let value = key.value!;
      if (ctrlActive && value.length === 1) {
        // Convert to control character (Ctrl+A = 0x01, Ctrl+C = 0x03, etc.)
        value = String.fromCharCode(value.toUpperCase().charCodeAt(0) - 64);
        setCtrlActive(false);
      }

      // Trigger sendKey change (append timestamp to ensure re-render)
      setSendKey(value + Date.now());
    },
    [ctrlActive],
  );

  const handleClose = useCallback(async () => {
    router.back();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: "#1a1a2e" }]}>
      <Stack.Screen
        options={{
          title: "Terminal",
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#e0e0e0",
        }}
      />

      <TerminalView
        wsUrl={wsUrl}
        sendKey={sendKey}
        onClose={handleClose}
        dom={{
          scrollEnabled: false,
          contentInsetAdjustmentBehavior: "never",
          style: { flex: 1 },
        }}
      />

      {/* Key Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
        {TOOLBAR_KEYS.map((key) => (
          <TouchableOpacity
            key={key.label}
            style={[
              styles.toolbarKey,
              { backgroundColor: colors.background },
              key.label === "Ctrl" && ctrlActive && {
                backgroundColor: colors.primary,
              },
            ]}
            activeOpacity={0.6}
            onPress={() => handleKeyPress(key)}
          >
            <Text
              style={[
                styles.toolbarKeyText,
                { color: colors.text },
                key.label === "Ctrl" && ctrlActive && { color: "#fff" },
              ]}
            >
              {key.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toolbarKey: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: 6,
    minWidth: 36,
  },
  toolbarKeyText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/projects/terminal.tsx
git commit -m "feat: add terminal screen with native key toolbar"
```

---

### Task 4: Register the terminal screen in the projects layout

**Files:**
- Modify: `app/(tabs)/projects/_layout.tsx:13-16`

**Step 1: Add the terminal screen to the Stack**

After the existing `<Stack.Screen name="[id]" />` line (line 16), add:

```tsx
<Stack.Screen name="terminal" options={{ title: 'Terminal', headerShown: true }} />
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/projects/_layout.tsx
git commit -m "feat: register terminal screen in projects stack navigator"
```

---

### Task 5: Add terminal icon to project detail header

**Files:**
- Modify: `app/(tabs)/projects/[id].tsx:57`

**Step 1: Add terminal button to the header**

Replace the `<Stack.Screen>` line (line 57) with a version that includes a headerRight button:

```tsx
<Stack.Screen
  options={{
    title: projectName,
    headerRight: () =>
      !isCloning && !isError ? (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/(tabs)/projects/terminal',
              params: { id },
            })
          }
          style={{ marginRight: Spacing.sm }}
          activeOpacity={0.7}
        >
          <Ionicons name="terminal-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      ) : null,
  }}
/>
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/projects/\[id\].tsx
git commit -m "feat: add terminal icon button to project detail header"
```

---

### Task 6: Verify the sendKey prop mechanism works

**Step 1: Review the sendKey pattern**

The `sendKey` prop passes keystrokes from the native toolbar to the DOM component. Since DOM component props must be serializable, we append `Date.now()` to force a new prop value on each press. The DOM component's `useEffect` watches `sendKey` and extracts the key value (stripping the timestamp suffix).

**Step 2: Fix the sendKey parsing in TerminalView**

Update the `useEffect` in `TerminalView.tsx` to properly extract the key value. The value before the timestamp is variable length, so we need a separator:

In `terminal.tsx`, change the setSendKey call to:

```tsx
setSendKey(value + "|" + Date.now());
```

In `TerminalView.tsx`, update the sendKey effect to:

```tsx
useEffect(() => {
  if (sendKey && terminalRef.current) {
    const keyValue = sendKey.split("|")[0];
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && keyValue) {
      ws.send(JSON.stringify({ type: "input", data: keyValue }));
    }
  }
}, [sendKey]);
```

**Step 3: Commit**

```bash
git add components/TerminalView.tsx app/\(tabs\)/projects/terminal.tsx
git commit -m "fix: use separator in sendKey prop for reliable key extraction"
```

---

### Task 7: Manual integration test

**Step 1: Start the CCR server with terminal support**

Ensure the server from the server plan is running with the terminal endpoint.

**Step 2: Open the app and navigate to a project**

- Go to Projects tab
- Tap on a project
- Tap the terminal icon in the header

**Step 3: Verify terminal functionality**

- [ ] Terminal opens and shows a shell prompt
- [ ] Typing on keyboard sends characters to the shell
- [ ] Output renders with colors (try `ls --color`)
- [ ] Tab key works (from toolbar)
- [ ] Arrow keys work (from toolbar) — test command history
- [ ] Ctrl+C works (Ctrl toggle + C key)
- [ ] Esc key works (from toolbar)
- [ ] Navigating back and returning reconnects with output history
- [ ] Device rotation resizes the terminal

**Step 4: Commit any fixes**

```bash
git commit -am "fix: terminal integration test fixes"
```

---

### Known Limitations

- **Android xterm.js `onData` bug** (xtermjs/xterm.js#5108): Keystrokes may only fire on Enter. Monitor upstream.
- **WebView cold start**: 1-2 seconds on first load.
- **Ctrl key**: Currently a toggle — could be improved to a hold-to-activate pattern in a future iteration.
