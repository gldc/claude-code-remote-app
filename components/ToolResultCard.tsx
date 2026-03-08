import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius, FontFamily } from '../constants/theme';

interface Props {
  output: string;
  isError?: boolean;
}

export function ToolResultCard({ output, isError }: Props) {
  const [expanded, setExpanded] = useState(false);
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const icon = isError ? 'close-circle' : 'checkmark-circle';
  const color = isError ? colors.error : colors.success;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.6}
      >
        <Ionicons name={icon} size={14} color={color} />
        <Text style={styles.preview} numberOfLines={1}>
          {output.slice(0, 100)}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.body}>
          <Text style={styles.code} selectable>{output}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      marginHorizontal: Spacing.lg,
      marginVertical: 3,
      borderRadius: BorderRadius.md,
      backgroundColor: c.toolBg,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      gap: 6,
    },
    preview: {
      flex: 1,
      fontSize: FontSize.xs,
      color: c.textMuted,
      fontFamily: FontFamily.mono,
    },
    body: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    code: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.xs - 1,
      color: c.textSecondary,
      backgroundColor: c.toolIconBg,
      borderRadius: 6,
      padding: Spacing.sm,
      overflow: 'hidden',
    },
  });
