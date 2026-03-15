import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Keyboard,
  Animated,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, Stack, router, useNavigation } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
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
  const [copyTrigger, setCopyTrigger] = useState("");
  const [hasSelection, setHasSelection] = useState(false);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  // Clean up toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleOpenUrl = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  const handleCopyText = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopyToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setCopyToastVisible(false), 800);
  }, []);

  const handleCopyPress = useCallback(() => {
    setCopyTrigger("copy|" + Date.now());
  }, []);

  // Hide tab bar on this screen
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      parent?.setOptions({
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
        },
      });
    };
  }, [navigation, colors.tabBar, colors.tabBarBorder]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: e.duration || 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: (e as any).duration || 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeight]);

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
        copyTrigger={copyTrigger}
        ctrlActive={ctrlActive}
        onCtrlConsumed={() => setCtrlActive(false)}
        onOpenUrl={handleOpenUrl}
        onCopyText={handleCopyText}
        onSelectionChange={setHasSelection}
        theme={theme}
        dom={{
          scrollEnabled: false,
          contentInsetAdjustmentBehavior: "never",
          style: { flex: 1 },
        }}
      />

      {/* Copied toast */}
      {copyToastVisible && (
        <View style={styles.toastContainer} pointerEvents="none">
          <View style={[styles.toast, { backgroundColor: colors.primary }]}>
            <Text style={[styles.toastText, { color: colors.buttonText }]}>Copied</Text>
          </View>
        </View>
      )}

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
                  ctrlActive && { color: colors.buttonText },
              ]}
            >
              {key.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.toolbarKey,
            {
              backgroundColor: hasSelection ? colors.primary : colors.background,
              opacity: hasSelection ? 1 : 0.5,
            },
          ]}
          activeOpacity={0.6}
          onPress={handleCopyPress}
          disabled={!hasSelection}
        >
          <Text
            style={[
              styles.toolbarKeyText,
              { color: hasSelection ? colors.buttonText : colors.text },
            ]}
          >
            Copy
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ height: keyboardHeight }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toastContainer: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  toast: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  toastText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
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
