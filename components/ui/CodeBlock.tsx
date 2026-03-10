import { View, Text, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing, BorderRadius } from '../../constants/theme';
import { TextVariants } from '../../constants/typography';

interface CodeBlockProps {
  children: string;
  numberOfLines?: number;
}

export function CodeBlock({ children, numberOfLines }: CodeBlockProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.code} numberOfLines={numberOfLines}>{children}</Text>
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: { backgroundColor: c.toolIconBg, borderRadius: BorderRadius.sm, padding: Spacing.sm },
  code: { ...TextVariants.code, color: c.textSecondary },
});
