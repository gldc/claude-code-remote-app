import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, Spacing, BorderRadius, FontSize } from '../../constants/theme';

interface ListItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  spaced?: boolean;
}

export function ListItem({ icon, iconColor, title, subtitle, onPress, trailing, spaced = true }: ListItemProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const content = (
    <View style={[styles.row, spaced && styles.spaced]}>
      <Ionicons name={icon} size={20} color={iconColor ?? colors.primary} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null)}
    </View>
  );
  if (onPress) return <TouchableOpacity activeOpacity={0.7} onPress={onPress}>{content}</TouchableOpacity>;
  return content;
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: c.cardBorder, gap: Spacing.md },
  spaced: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  info: { flex: 1, gap: 2 },
  title: { fontSize: FontSize.md, color: c.text, fontWeight: '500' },
  subtitle: { fontSize: FontSize.sm, color: c.textMuted },
});
