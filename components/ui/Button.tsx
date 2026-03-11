import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing, BorderRadius } from '../../constants/theme';
import { TextVariants } from '../../constants/typography';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  title, onPress, variant = 'primary', size = 'lg', disabled = false, loading = false, icon, style,
}: ButtonProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const containerStyle: ViewStyle[] = [
    styles.base, styles[`size_${size}`], styles[`variant_${variant}`],
    (disabled || loading) && styles.disabled, style,
  ].filter(Boolean) as ViewStyle[];
  const textColor = variant === 'primary' || variant === 'destructive'
    ? colors.buttonText : variant === 'secondary' ? colors.text : colors.primary;
  return (
    <TouchableOpacity style={containerStyle} onPress={onPress} disabled={disabled || loading} activeOpacity={0.7}>
      {loading ? <ActivityIndicator color={textColor} /> : (
        <>{icon}<Text style={[size === 'sm' ? TextVariants.buttonSmall : TextVariants.button, { color: textColor }]}>{title}</Text></>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md },
  size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  size_md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  size_lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  variant_primary: { backgroundColor: c.primary },
  variant_secondary: { backgroundColor: c.card, borderWidth: 1, borderColor: c.cardBorder },
  variant_destructive: { backgroundColor: c.error },
  variant_ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.6 },
});
