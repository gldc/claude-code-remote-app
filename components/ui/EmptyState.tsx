import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize } from '../../constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, hint, actionLabel, onAction }: EmptyStateProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} variant="secondary" size="sm" /> : null}
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  title: { fontSize: FontSize.lg, color: c.textMuted, fontWeight: '600' },
  hint: { fontSize: FontSize.sm, color: c.textMuted, textAlign: 'center' },
});
