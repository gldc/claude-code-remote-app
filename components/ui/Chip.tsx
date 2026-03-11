import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, Spacing, BorderRadius, FontSize } from '../../constants/theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  showCheck?: boolean;
}

export function Chip({ label, active = false, onPress, showCheck = false }: ChipProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.7}>
      {showCheck && active ? <Ionicons name="checkmark" size={14} color={colors.primary} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: c.cardBorder, backgroundColor: c.card },
  chipActive: { borderColor: c.primary, backgroundColor: c.primaryBg15 },
  chipText: { fontSize: FontSize.sm, color: c.textSecondary },
  chipTextActive: { color: c.primary, fontWeight: '600' },
});
