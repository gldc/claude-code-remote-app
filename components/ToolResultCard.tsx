import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, FontFamily } from '../constants/theme';

interface Props {
  output: string;
  isError?: boolean;
}

export function ToolResultCard({ output, isError }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = isError ? Colors.error : Colors.success;

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isError ? 'close-circle' : 'checkmark-circle'}
          size={16}
          color={color}
        />
        <Text style={[styles.label, { color }]}>
          {isError ? 'Error' : 'Result'}
        </Text>
        <Text style={styles.preview} numberOfLines={1}>
          {output.slice(0, 80)}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textMuted}
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

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  preview: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  body: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  code: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
