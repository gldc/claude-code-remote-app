import { useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useAppStore } from "../../../lib/store";
import { useColors, FontSize, Spacing } from "../../../constants/theme";
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
  const colorScheme = useColorScheme();
  const [ctrlActive, setCtrlActive] = useState(false);
  const [sendKey, setSendKey] = useState("");

  const wsUrl = `ws://${hostConfig.address}:${hostConfig.port}/ws/terminal/${id}`;
  const theme = colorScheme === "dark" ? "dark" : "light";

  const handleKeyPress = useCallback(
    (key: (typeof TOOLBAR_KEYS)[number]) => {
      if (key.label === "Ctrl") {
        setCtrlActive((prev) => !prev);
        return;
      }

      let value = key.value!;
      if (ctrlActive) {
        if (value.length === 1 && /[a-zA-Z]/.test(value)) {
          // Convert to control character (Ctrl+A = 0x01, Ctrl+C = 0x03, etc.)
          value = String.fromCharCode(
            value.toUpperCase().charCodeAt(0) - 64,
          );
        }
        setCtrlActive(false);
      }

      setSendKey(value + "|" + Date.now());
    },
    [ctrlActive],
  );

  // Terminal bg matches the xterm theme
  const termBg = theme === "dark" ? "#141210" : "#2D2A26";

  return (
    <View style={[styles.container, { backgroundColor: termBg }]}>
      <Stack.Screen
        options={{
          title: "Terminal",
          headerStyle: { backgroundColor: termBg },
          headerTintColor: "#E8DDD0",
        }}
      />

      <TerminalView
        wsUrl={wsUrl}
        sendKey={sendKey}
        theme={theme}
        dom={{
          scrollEnabled: false,
          contentInsetAdjustmentBehavior: "never",
          style: { flex: 1 },
        }}
      />

      {/* Key Toolbar */}
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.cardBorder,
          },
        ]}
      >
        {TOOLBAR_KEYS.map((key) => (
          <TouchableOpacity
            key={key.label}
            style={[
              styles.toolbarKey,
              { backgroundColor: colors.background },
              key.label === "Ctrl" &&
                ctrlActive && {
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
                key.label === "Ctrl" &&
                  ctrlActive && { color: "#fff" },
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
