import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius, IconSize } from '../../constants/theme';
import type { OnboardingStepProps } from './types';

const CCR_REPO_URL = 'https://github.com/anthropics/claude-code-remote';

export function WelcomeStep({ onNext, onSkip }: OnboardingStepProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  return (
    <View style={styles.container}>
      {/* Skip button top-right */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Hero area */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>📱 ↔ 💻</Text>
      </View>

      {/* App name + tagline */}
      <Text style={styles.title}>Claude Code Remote</Text>
      <Text style={styles.tagline}>
        Manage Claude Code sessions from your phone. Create sessions, stream output live, and approve tool use — over Tailscale.
      </Text>

      {/* CCR server link */}
      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => Linking.openURL(CCR_REPO_URL)}
        activeOpacity={0.7}
      >
        <Ionicons name="logo-github" size={IconSize.md} color={colors.primary} />
        <Text style={styles.linkText}>Set up your CCR server</Text>
        <Ionicons name="open-outline" size={IconSize.sm} color={colors.textMuted} />
      </TouchableOpacity>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaButton} onPress={onNext} activeOpacity={0.8}>
        <Text style={styles.ctaText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={IconSize.lg} color={colors.buttonText} />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.xl,
      alignItems: 'center',
    },
    skipButton: {
      alignSelf: 'flex-end',
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
    },
    skipText: {
      fontSize: FontSize.sm,
      color: c.textMuted,
    },
    hero: {
      marginTop: Spacing.xl,
      marginBottom: Spacing.xl,
      backgroundColor: c.primaryBg15,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.xxl,
      paddingHorizontal: Spacing.xxl + Spacing.lg,
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    heroEmoji: {
      fontSize: 48,
      textAlign: 'center',
    },
    title: {
      fontSize: FontSize.xxl,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    tagline: {
      fontSize: FontSize.md,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing.xl,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.card,
      marginBottom: Spacing.xxl,
    },
    linkText: {
      fontSize: FontSize.sm,
      color: c.primary,
      fontWeight: '600',
      flex: 1,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: c.primary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xxl,
      alignSelf: 'stretch',
    },
    ctaText: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: c.buttonText,
    },
  });
