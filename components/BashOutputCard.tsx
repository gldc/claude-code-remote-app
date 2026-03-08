import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ExpandableCard } from './ExpandableCard';
import { AnsiRenderer } from './AnsiRenderer';
import { useColors, useThemedStyles, type ColorPalette, FontFamily, FontSize, Spacing } from '../constants/theme';

interface BashOutputCardProps {
  output: string;
}

export function BashOutputCard({ output }: BashOutputCardProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const lines = output.split('\n');
  const preview = lines.slice(-3).join('\n');

  return (
    <ExpandableCard
      title="Bash Output"
      icon="terminal"
      badge={`${lines.length} lines`}
      preview={
        <Text style={styles.preview} numberOfLines={3}>
          {preview}
        </Text>
      }
    >
      <AnsiRenderer text={output} />
    </ExpandableCard>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    preview: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.xs - 1,
      color: c.textMuted,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },
  });
