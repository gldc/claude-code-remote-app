import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Chip } from './Chip';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize } from '../../constants/theme';

interface ChipOption { label: string; value: string; }

interface ChipGroupProps {
  options: ChipOption[];
  label?: string;
  selected: string | string[] | null;
  onSelect: (value: string) => void;
  multi?: boolean;
  horizontal?: boolean;
}

export function ChipGroup({ options, label, selected, onSelect, multi = false, horizontal = false }: ChipGroupProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const isActive = (value: string) => Array.isArray(selected) ? selected.includes(value) : selected === value;
  const chips = options.map((opt) => (
    <Chip key={opt.value} label={opt.label} active={isActive(opt.value)} onPress={() => onSelect(opt.value)} showCheck={multi} />
  ));
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {horizontal ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>{chips}</ScrollView>
      ) : (
        <View style={styles.wrapContent}>{chips}</View>
      )}
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  label: { fontSize: FontSize.sm, fontWeight: '600', color: c.textMuted, marginBottom: Spacing.xs },
  scrollContent: { gap: Spacing.sm },
  wrapContent: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
