import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, Spacing, ComponentSize } from '../../constants/theme';
import { shadowFab } from '../../constants/shadows';

interface FABProps {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export function FAB({ icon = 'add', onPress }: FABProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={onPress}>
      <Ionicons name={icon} size={ComponentSize.fabIcon} color={colors.buttonText} />
    </TouchableOpacity>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  fab: {
    position: 'absolute', right: Spacing.lg, bottom: Spacing.lg,
    width: ComponentSize.fab, height: ComponentSize.fab, borderRadius: ComponentSize.fab / 2,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', ...shadowFab,
  },
});
