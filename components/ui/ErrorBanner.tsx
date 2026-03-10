import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { Button } from './Button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <View style={styles.banner}>
      <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
      {onRetry ? <Button title="Retry" onPress={onRetry} variant="ghost" size="sm" /> : null}
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: c.error + '15', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: c.error + '30' },
  message: { flex: 1, fontSize: FontSize.sm, color: c.error },
});
