import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing, BorderRadius } from '../../constants/theme';
import { shadowCard } from '../../constants/shadows';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  margin?: number;
  padding?: number;
  elevated?: boolean;
}

export function Card({ children, style, margin = Spacing.lg, padding = Spacing.lg, elevated = false }: CardProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <View style={[styles.card, { marginHorizontal: margin, padding }, elevated && shadowCard, style]}>
      {children}
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  card: { backgroundColor: c.card, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: c.cardBorder },
});
