import { Text, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing } from '../../constants/theme';
import { TextVariants } from '../../constants/typography';

interface FormLabelProps { children: string; }

export function FormLabel({ children }: FormLabelProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return <Text style={styles.label}>{children}</Text>;
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  label: { ...TextVariants.sectionLabel, color: c.textMuted, marginBottom: Spacing.xs, marginTop: Spacing.md },
});
