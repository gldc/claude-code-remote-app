import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';

interface FilterChipsProps {
  options: { label: string; value: string | null }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.label}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
      alignItems: 'center',
    },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.card,
    },
    chipActive: {
      borderColor: c.primary,
      backgroundColor: c.primary + '20',
    },
    chipText: {
      fontSize: FontSize.sm,
      color: c.textMuted,
    },
    chipTextActive: {
      color: c.primary,
    },
  });
