import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface ChipSelectorProps {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  label?: string;
}

export const ChipSelector = React.memo(function ChipSelector({
  options, selected, onToggle, label,
}: ChipSelectorProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map(opt => {
          const isSelected = selected.includes(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onToggle(opt.value)}
              style={[styles.chip, isSelected && styles.chipSelected]}
              activeOpacity={0.7}
            >
              {isSelected && <SymbolView name="checkmark" size={12} tintColor={colors.primary} />}
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, color: c.textMuted, fontWeight: '500' },
  row: { gap: Spacing.sm, paddingVertical: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: c.cardBorder,
    backgroundColor: c.card,
  },
  chipSelected: { borderColor: c.primary, backgroundColor: c.primaryBg15 },
  chipText: { fontSize: FontSize.sm, color: c.textSecondary },
  chipTextSelected: { color: c.primary, fontWeight: '600' },
});
