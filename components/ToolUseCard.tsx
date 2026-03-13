import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius, FontFamily } from '../constants/theme';
import { FontSize_code } from '../constants/typography';

interface Props {
  toolName: string;
  toolInput: Record<string, any>;
}

export function ToolUseCard({ toolName, toolInput }: Props) {
  const [expanded, setExpanded] = useState(false);
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const summary = getSummary(toolName, toolInput);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.6}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="terminal-outline" size={12} color={colors.textMuted} />
        </View>
        <Text style={styles.toolName}>{toolName}</Text>
        {summary && !expanded && (
          <Text style={styles.summary} numberOfLines={1}>{summary}</Text>
        )}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.body}>
          <Text style={styles.code}>
            {JSON.stringify(toolInput, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
}

function getSummary(toolName: string, input: Record<string, any>): string {
  if (input.command) return input.command;
  if (input.file_path) return input.file_path.split('/').pop() || '';
  if (input.pattern) return input.pattern;
  if (input.query) return input.query;
  return '';
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
      gap: Spacing.sm,
    },
    iconWrap: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.toolIconBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolName: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: c.textMuted,
    },
    summary: {
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
      fontSize: FontSize_code,
      color: c.textSecondary,
      backgroundColor: c.toolIconBg,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      overflow: 'hidden',
    },
  });
