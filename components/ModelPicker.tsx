import React from 'react';
import { TouchableOpacity, Text, ActionSheetIOS, Platform, Alert, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface ModelPickerProps {
  selected: string | null;
  onSelect: (model: string) => void;
}

const MODELS = [
  { id: 'claude-opus-4-6', label: 'Opus 4.6' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5' },
];

function getModelLabel(id: string | null): string {
  if (!id) return 'Default';
  return MODELS.find(m => m.id === id)?.label ?? id;
}

export const ModelPicker = React.memo(function ModelPicker({ selected, onSelect }: ModelPickerProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const handlePress = () => {
    const options = [...MODELS.map(m => m.label), 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, title: 'Select Model' },
        (index) => {
          if (index < MODELS.length) onSelect(MODELS[index].id);
        },
      );
    } else {
      Alert.alert('Select Model', undefined, [
        ...MODELS.map(m => ({ text: m.label, onPress: () => onSelect(m.id) })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.7}>
      <SymbolView name="cpu" size={16} tintColor={colors.textMuted} />
      <Text style={styles.label}>{getModelLabel(selected)}</Text>
      <SymbolView name="chevron.down" size={12} tintColor={colors.textMuted} />
    </TouchableOpacity>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: c.card, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: c.cardBorder,
  },
  label: { fontSize: FontSize.sm, color: c.text, fontWeight: '500' },
});
