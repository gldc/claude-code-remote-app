import React, { useRef, useCallback, useState } from 'react';
import { Pressable, Animated, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useCopyText } from '../lib/useCopyText';
import { useColors, type ColorPalette, FontSize, BorderRadius, Spacing } from '../constants/theme';

interface Props {
  text: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CopyablePressable({ text, children, style }: Props) {
  const copyText = useCopyText();
  const colors = useColors();
  const opacity = useRef(new Animated.Value(1)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);

  const handleLongPress = useCallback(() => {
    copyText(text);

    // Flash the card
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.5, duration: 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Show "Copied" toast
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowToast(false));
  }, [text, copyText, opacity, toastOpacity]);

  return (
    <Animated.View style={[style, { opacity }]}>
      <Pressable onLongPress={handleLongPress}>
        {children}
      </Pressable>
      {showToast && (
        <Animated.View
          style={[
            styles.toast,
            { backgroundColor: colors.text, opacity: toastOpacity },
          ]}
          pointerEvents="none"
        >
          <Text style={[styles.toastText, { color: colors.background }]}>Copied</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  toastText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
