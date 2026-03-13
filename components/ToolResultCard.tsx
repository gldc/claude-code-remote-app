import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ExpandableCard } from './ExpandableCard';
import { DiffViewer } from './DiffViewer';
import { SyntaxHighlightedText } from './SyntaxHighlightedText';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, FontFamily } from '../constants/theme';
import { FontSize_code } from '../constants/typography';

interface Props {
  output: string;
  isError?: boolean;
}

type ContentType = 'diff' | 'code' | 'error' | 'plain';

function detectContentType(output: string, isError?: boolean): ContentType {
  if (isError) return 'error';
  const trimmed = output.trimStart();
  if (
    trimmed.startsWith('diff ') ||
    trimmed.startsWith('--- ') ||
    trimmed.startsWith('+++ ') ||
    trimmed.startsWith('@@ ')
  ) {
    return 'diff';
  }
  if (
    trimmed.startsWith('{') ||
    trimmed.startsWith('[') ||
    trimmed.startsWith('function ') ||
    trimmed.startsWith('const ') ||
    trimmed.startsWith('import ') ||
    trimmed.startsWith('export ') ||
    trimmed.startsWith('class ') ||
    trimmed.startsWith('def ') ||
    trimmed.startsWith('#!') ||
    /^\s*(public|private|protected)\s/.test(trimmed)
  ) {
    return 'code';
  }
  return 'plain';
}

export function ToolResultCard({ output, isError }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const contentType = detectContentType(output, isError);
  const lines = output.split('\n');
  const icon = isError
    ? { ios: 'xmark.circle', android: 'cancel' }
    : { ios: 'checkmark.circle', android: 'check_circle' };
  const badgeText = isError ? 'error' : `${lines.length} lines`;

  const renderContent = () => {
    switch (contentType) {
      case 'diff':
        return <DiffViewer diff={output} />;
      case 'code':
        return <SyntaxHighlightedText code={output} />;
      case 'error':
        return <Text style={styles.errorText} selectable>{output}</Text>;
      case 'plain':
      default:
        return <Text style={styles.plainText} selectable>{output}</Text>;
    }
  };

  return (
    <ExpandableCard
      title="Tool Result"
      icon={icon}
      badge={badgeText}
      preview={
        <Text selectable style={[styles.preview, isError && styles.errorPreview]} numberOfLines={2}>
          {output.slice(0, 200)}
        </Text>
      }
    >
      {renderContent()}
    </ExpandableCard>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    preview: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize_code,
      color: c.textMuted,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    errorPreview: {
      color: c.error,
    },
    errorText: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize_code,
      color: c.error,
      padding: Spacing.sm,
    },
    plainText: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize_code,
      color: c.textSecondary,
      padding: Spacing.sm,
    },
  });
