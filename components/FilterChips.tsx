import { View, StyleSheet } from 'react-native';
import { ChipGroup } from './ui/ChipGroup';
import { Spacing } from '../constants/theme';

interface FilterChipsProps {
  options: { label: string; value: string | null }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

const NULL_SENTINEL = '__all__';

export function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  const chipOptions = options.map((opt) => ({
    label: opt.label,
    value: opt.value ?? NULL_SENTINEL,
  }));

  const chipSelected = selected ?? NULL_SENTINEL;

  const handleSelect = (value: string) => {
    onSelect(value === NULL_SENTINEL ? null : value);
  };

  return (
    <View style={styles.container}>
      <ChipGroup
        options={chipOptions}
        selected={chipSelected}
        onSelect={handleSelect}
        horizontal
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
