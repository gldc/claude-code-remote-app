import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { getExpoPushToken } from '../../lib/notifications';
import type { OnboardingStepProps } from './types';

export function NotificationsStep({ onNext, onSkip }: OnboardingStepProps) {
  const [requesting, setRequesting] = useState(false);
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const handleEnable = async () => {
    setRequesting(true);
    await getExpoPushToken();
    onNext();
  };

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: colors.warningBg10 }]}>
        <Text style={styles.heroEmoji}>🔔</Text>
      </View>

      {/* Title & Subtitle */}
      <Text style={styles.title}>Stay in the Loop</Text>
      <Text style={styles.subtitle}>Get notified when Claude needs you</Text>

      {/* Notification type rows */}
      <View style={styles.notifList}>
        <View style={styles.notifRow}>
          <View style={[styles.notifIconBg, { backgroundColor: colors.warningBg10 }]}>
            <Ionicons name="flash" size={20} color={colors.warning} />
          </View>
          <View style={styles.notifInfo}>
            <Text style={styles.notifLabel}>Approval Requests</Text>
            <Text style={styles.notifDesc}>When Claude needs your permission</Text>
          </View>
        </View>

        <View style={styles.notifRow}>
          <View style={[styles.notifIconBg, { backgroundColor: colors.successBg10 }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>
          <View style={styles.notifInfo}>
            <Text style={styles.notifLabel}>Session Completions</Text>
            <Text style={styles.notifDesc}>When a session finishes successfully</Text>
          </View>
        </View>

        <View style={styles.notifRow}>
          <View style={[styles.notifIconBg, { backgroundColor: colors.errorBg10 }]}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
          </View>
          <View style={styles.notifInfo}>
            <Text style={styles.notifLabel}>Session Errors</Text>
            <Text style={styles.notifDesc}>When something goes wrong</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>You can customize notification types in Settings</Text>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.primaryButton, requesting && { opacity: 0.6 }]}
        onPress={handleEnable}
        disabled={requesting}
        activeOpacity={0.8}
      >
        {requesting ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={styles.primaryButtonText}>Enable Notifications →</Text>
        )}
      </TouchableOpacity>

      {/* Secondary */}
      <TouchableOpacity style={styles.secondaryButton} onPress={onNext}>
        <Text style={styles.secondaryButtonText}>Not now</Text>
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
    },
    skipButton: {
      alignSelf: 'flex-end',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    skipText: {
      fontSize: FontSize.md,
      color: c.textMuted,
    },
    hero: {
      width: 100,
      height: 100,
      borderRadius: BorderRadius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    heroEmoji: {
      fontSize: 48,
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
      marginBottom: Spacing.xl,
    },
    notifList: {
      width: '100%',
      marginBottom: Spacing.lg,
      gap: Spacing.sm,
    },
    notifRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    notifIconBg: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    notifInfo: {
      flex: 1,
    },
    notifLabel: {
      fontSize: FontSize.md,
      fontWeight: '600',
      color: c.text,
      marginBottom: 2,
    },
    notifDesc: {
      fontSize: FontSize.sm,
      color: c.textMuted,
    },
    footer: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    primaryButton: {
      backgroundColor: c.primary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
      width: '100%',
      marginBottom: Spacing.md,
    },
    primaryButtonText: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: c.buttonText,
    },
    secondaryButton: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    secondaryButtonText: {
      fontSize: FontSize.md,
      color: c.textMuted,
    },
  });
