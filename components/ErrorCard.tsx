import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';

export function ErrorCard({ message }: { message: string }) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <View style={styles.card}>
      <Ionicons name="alert-circle" size={18} color={colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      marginHorizontal: Spacing.lg,
      marginVertical: Spacing.xs,
      backgroundColor: c.error + '15',
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.error + '30',
    },
    text: {
      flex: 1,
      fontSize: FontSize.sm,
      color: c.error,
    },
  });
