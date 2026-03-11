import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../constants/theme';

interface DoneStepProps {
  onFinish: () => void;
}

export function DoneStep({ onFinish }: DoneStepProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: colors.successBg10 }]}>
        <Text style={styles.heroEmoji}>🎉</Text>
        <Text style={styles.heroSubtext}>You're all set!</Text>
      </View>

      {/* Title & Subtitle */}
      <Text style={styles.title}>Ready to Go</Text>
      <Text style={styles.subtitle}>
        Your server is connected and notifications are enabled. Start your first session!
      </Text>

      {/* CTA */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onFinish}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Start Your First Session 🚀</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hero: {
      width: 140,
      height: 140,
      borderRadius: BorderRadius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    heroEmoji: {
      fontSize: 56,
    },
    heroSubtext: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: c.success,
      marginTop: Spacing.xs,
    },
    title: {
      fontSize: FontSize.xxl,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: FontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing.xxl,
    },
    primaryButton: {
      backgroundColor: c.success,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
      width: '100%',
    },
    primaryButtonText: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: c.buttonText,
    },
  });
