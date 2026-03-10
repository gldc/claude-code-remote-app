import { Text, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing } from '../../constants/theme';
import { TextVariants } from '../../constants/typography';

interface SectionHeaderProps { children: string; }

export function SectionHeader({ children }: SectionHeaderProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return <Text style={styles.header}>{children}</Text>;
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  header: { ...TextVariants.sectionLabel, color: c.textMuted, marginTop: Spacing.xl, marginBottom: Spacing.sm },
});
