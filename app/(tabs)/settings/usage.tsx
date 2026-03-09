import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useUsageData } from '../../../lib/api';
import { ProgressMeter } from '../../../components/ProgressMeter';
import { TimeCountdown } from '../../../components/TimeCountdown';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../../../constants/theme';

export default function UsageScreen() {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const { data: usage, refetch, isLoading } = useUsageData();

  const isUnavailable = !usage || usage.plan_tier === 'unknown';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <View style={styles.planBadge}>
        <Text style={styles.planText}>{usage?.plan_tier ?? 'Unknown'} Plan</Text>
      </View>

      {isUnavailable && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Usage data requires a Claude Max subscription with OAuth authentication.
            If you're using API keys, usage tracking is not available.
          </Text>
        </View>
      )}

      {!isUnavailable && (
        <>
          <View style={styles.section}>
            <ProgressMeter
              label="Session (5-hour)"
              percent={usage.session.percent_remaining}
            />
            <TimeCountdown seconds={usage.session.resets_in_seconds} />
          </View>

          <View style={styles.section}>
            <ProgressMeter
              label="Weekly"
              percent={usage.weekly.percent_remaining}
              reservePercent={usage.weekly.reserve_percent}
            />
            <TimeCountdown seconds={usage.weekly.resets_in_seconds} />
          </View>

          <View style={styles.section}>
            <ProgressMeter
              label="Sonnet"
              percent={usage.sonnet.percent_remaining}
            />
            <TimeCountdown seconds={usage.sonnet.resets_in_seconds} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extra Usage</Text>
            <ProgressMeter
              label={`$${usage.extra_usage.monthly_spend.toFixed(2)} / $${usage.extra_usage.monthly_limit.toFixed(2)}`}
              percent={
                (1 - usage.extra_usage.monthly_spend / Math.max(usage.extra_usage.monthly_limit, 1)) * 100
              }
              size="sm"
            />
          </View>
        </>
      )}

      <View style={{ height: Spacing.xxl * 2 }} />
    </ScrollView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: Spacing.lg },
    planBadge: {
      alignSelf: 'flex-start',
      backgroundColor: c.primary + '20',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.lg,
    },
    planText: { fontSize: FontSize.sm, fontWeight: '600', color: c.primary },
    section: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: c.textMuted,
      marginBottom: Spacing.xs,
    },
    infoBanner: {
      backgroundColor: c.primary + '10',
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: c.primary + '30',
      marginBottom: Spacing.md,
    },
    infoBannerText: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      lineHeight: FontSize.sm * 1.5,
    },
  });
