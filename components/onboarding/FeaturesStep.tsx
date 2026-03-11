import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius, IconSize } from '../../constants/theme';
import type { OnboardingStepProps } from './types';

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
  styles: ReturnType<typeof makeStyles>;
}

function FeatureCard({ icon, iconColor, bgColor, title, description, styles }: FeatureCardProps) {
  return (
    <View style={[styles.featureCard, { backgroundColor: bgColor }]}>
      <View style={styles.featureIconWrap}>
        <Ionicons name={icon} size={IconSize.xxl} color={iconColor} />
      </View>
      <View style={styles.featureTextWrap}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </View>
  );
}

export function FeaturesStep({ onNext, onSkip }: OnboardingStepProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  return (
    <View style={styles.container}>
      {/* Skip button top-right */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Text style={styles.title}>What You Can Do</Text>
      <Text style={styles.subtitle}>Everything Claude Code, right from your phone.</Text>

      <ScrollView style={styles.cardsScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardsContent}>
        <FeatureCard
          icon="chatbubbles"
          iconColor={colors.primary}
          bgColor={colors.primaryBg10}
          title="Sessions"
          description="Create, stream, and approve tool use in real time."
          styles={styles}
        />
        <FeatureCard
          icon="folder"
          iconColor={colors.success}
          bgColor={colors.successBg10}
          title="Projects"
          description="Manage repos and clone from Git with a tap."
          styles={styles}
        />
        <FeatureCard
          icon="settings"
          iconColor={colors.primary}
          bgColor={colors.primaryBg10}
          title="Settings"
          description="Configure templates, MCP servers, and approval rules."
          styles={styles}
        />
      </ScrollView>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaButton} onPress={onNext} activeOpacity={0.8}>
        <Text style={styles.ctaText}>Next</Text>
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
    title: {
      fontSize: FontSize.xl,
      fontWeight: '700',
      color: c.text,
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: FontSize.sm,
      color: c.textSecondary,
      marginBottom: Spacing.lg,
    },
    cardsScroll: {
      flex: 1,
    },
    cardsContent: {
      gap: Spacing.md,
      paddingBottom: Spacing.md,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    featureIconWrap: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTextWrap: {
      flex: 1,
    },
    featureTitle: {
      fontSize: FontSize.md,
      fontWeight: '700',
      color: c.text,
      marginBottom: Spacing.xs,
    },
    featureDesc: {
      fontSize: FontSize.sm,
      color: c.textSecondary,
      lineHeight: 18,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: c.primary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      marginTop: Spacing.lg,
    },
    ctaText: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: c.buttonText,
    },
  });
