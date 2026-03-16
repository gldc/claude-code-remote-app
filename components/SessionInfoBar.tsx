import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing } from '../constants/theme';
import { useShowCost } from '../lib/api';

interface SessionInfoBarProps {
  projectDir: string;
  gitBranch: string | null;
  costUsd: number;
  model: string | null;
  contextPercent: number;
  isConnected: boolean;
}

export function SessionInfoBar({
  projectDir,
  gitBranch,
  costUsd,
  model,
  contextPercent,
  isConnected,
}: SessionInfoBarProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const showCost = useShowCost();
  const [expanded, setExpanded] = useState(false);

  const containerWidth = useSharedValue(0);
  const textWidth = useSharedValue(0);
  const translateX = useSharedValue(0);
  const [measured, setMeasured] = useState(false);

  const project = projectDir.split('/').pop() ?? projectDir;
  const tickerText = [
    project,
    gitBranch ? `(${gitBranch})` : null,
    showCost ? `$${costUsd.toFixed(2)}` : null,
    model,
    contextPercent > 0 ? `${contextPercent}% ctx` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  const onContainerLayout = (e: LayoutChangeEvent) => {
    containerWidth.value = e.nativeEvent.layout.width;
  };

  const onTextLayout = (e: LayoutChangeEvent) => {
    textWidth.value = e.nativeEvent.layout.width;
    setMeasured(true);
  };

  useEffect(() => {
    if (!measured) return;
    const overflow = textWidth.value - containerWidth.value;
    if (overflow > 0 && !expanded) {
      // Scroll speed: ~30px/s
      const duration = (overflow / 30) * 1000;
      translateX.value = 0;
      translateX.value = withDelay(
        1500,
        withRepeat(
          withTiming(-overflow - 40, { duration, easing: Easing.linear }),
          -1,
          true,
        ),
      );
    } else {
      cancelAnimation(translateX);
      translateX.value = 0;
    }
    return () => cancelAnimation(translateX);
  }, [measured, expanded, tickerText]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (expanded) {
    return (
      <TouchableOpacity
        style={styles.expandedBar}
        onPress={() => setExpanded(false)}
        activeOpacity={0.8}
      >
        <View style={styles.expandedRow}>
          <Ionicons name="folder-outline" size={13} color={colors.textMuted} />
          <Text style={styles.expandedText}>{project}</Text>
        </View>
        {gitBranch && (
          <View style={styles.expandedRow}>
            <Ionicons name="git-branch-outline" size={13} color={colors.textMuted} />
            <Text style={styles.expandedText}>{gitBranch}</Text>
          </View>
        )}
        {showCost && (
          <View style={styles.expandedRow}>
            <Ionicons name="card-outline" size={13} color={colors.textMuted} />
            <Text style={styles.expandedText}>${costUsd.toFixed(4)}</Text>
          </View>
        )}
        {model && (
          <View style={styles.expandedRow}>
            <Ionicons name="hardware-chip-outline" size={13} color={colors.textMuted} />
            <Text style={styles.expandedText}>{model}</Text>
          </View>
        )}
        {contextPercent > 0 && (
          <View style={styles.expandedRow}>
            <Ionicons name="pie-chart-outline" size={13} color={colors.textMuted} />
            <Text style={styles.expandedText}>{contextPercent}% context used</Text>
          </View>
        )}
        <View style={[styles.connDot, { backgroundColor: isConnected ? colors.success : colors.error, alignSelf: 'flex-end', marginTop: -Spacing.xs }]} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.tickerBar}
      onPress={() => setExpanded(true)}
      activeOpacity={0.8}
      onLayout={onContainerLayout}
    >
      <View style={styles.tickerMask}>
        <Animated.Text
          style={[styles.tickerText, animatedStyle]}
          numberOfLines={1}
          onLayout={onTextLayout}
        >
          {tickerText}
        </Animated.Text>
      </View>
      <View style={[styles.connDot, { backgroundColor: isConnected ? colors.success : colors.error }]} />
    </TouchableOpacity>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    tickerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.cardBorder,
      gap: Spacing.sm,
    },
    tickerMask: {
      flex: 1,
      overflow: 'hidden',
    },
    tickerText: {
      fontSize: FontSize.xs,
      color: c.textMuted,
    },
    connDot: { width: 8, height: 8, borderRadius: 4 },
    expandedBar: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.cardBorder,
      gap: Spacing.xs,
    },
    expandedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    expandedText: {
      fontSize: FontSize.xs,
      color: c.textMuted,
    },
  });
