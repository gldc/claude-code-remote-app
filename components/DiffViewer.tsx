import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontFamily } from '../constants/theme';

interface DiffViewerProps {
  diff: string;
}

interface DiffLine {
  text: string;
  type: 'add' | 'remove' | 'header' | 'hunk' | 'context';
}

function parseDiff(diff: string): DiffLine[] {
  return diff.split('\n').map(line => {
    if (line.startsWith('+++') || line.startsWith('---')) {
      return { text: line, type: 'header' as const };
    }
    if (line.startsWith('@@')) {
      return { text: line, type: 'hunk' as const };
    }
    if (line.startsWith('+')) {
      return { text: line, type: 'add' as const };
    }
    if (line.startsWith('-')) {
      return { text: line, type: 'remove' as const };
    }
    return { text: line, type: 'context' as const };
  });
}

export const DiffViewer = React.memo(function DiffViewer({ diff }: DiffViewerProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const lines = parseDiff(diff);

  const lineStyles: Record<DiffLine['type'], object> = {
    add: { backgroundColor: colors.success + '20' },
    remove: { backgroundColor: colors.error + '20' },
    header: {},
    hunk: {},
    context: {},
  };

  const textStyles: Record<DiffLine['type'], object> = {
    add: { color: colors.success },
    remove: { color: colors.error },
    header: { color: colors.text, fontWeight: '700' as const },
    hunk: { color: colors.textMuted, fontWeight: '600' as const },
    context: { color: colors.codeText },
  };

  return (
    <ScrollView horizontal style={styles.container} showsHorizontalScrollIndicator={false}>
      <View style={styles.diffBlock}>
        {lines.map((line, i) => (
          <View key={i} style={[styles.line, lineStyles[line.type]]}>
            <Text style={[styles.lineText, textStyles[line.type]]}>{line.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: { backgroundColor: c.codeBg, borderRadius: 8, maxHeight: 400 },
  diffBlock: { padding: Spacing.sm },
  line: { paddingHorizontal: Spacing.xs, minHeight: 18 },
  lineText: { fontFamily: FontFamily.mono, fontSize: 12 },
});
