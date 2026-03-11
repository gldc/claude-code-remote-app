import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useUsageData } from '../../../lib/api';
import { ProgressMeter } from '../../../components/ProgressMeter';
import { TimeCountdown } from '../../../components/TimeCountdown';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../../../constants/theme';
import type { UsageWindow } from '../../../lib/types';

function percentRemaining(window: UsageWindow | null | undefined): number {
  if (!window) return 0;
  return Math.max(0, 100 - window.utilization);
}

export default function UsageScreen() {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const { data: usage, refetch, isLoading } = useUsageData();

  const hasUsageData = usage && usage.plan_tier && usage.plan_tier !== 'unknown';
  const planLabel = hasUsageData
    ? usage.plan_tier.charAt(0).toUpperCase() + usage.plan_tier.slice(1)
    : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {planLabel ? (
        <View style={styles.planBadge}>
          <Text style={styles.planText}>{planLabel} Plan</Text>
        </View>
      ) : null}

      {hasUsageData ? (
        <>
          {usage.five_hour && (
            <View style={styles.section}>
              <ProgressMeter
                label="Session (5-hour)"
                percent={percentRemaining(usage.five_hour)}
              />
              <TimeCountdown resetsAt={usage.five_hour.resets_at} />
            </View>
          )}

          {usage.seven_day && (
            <View style={styles.section}>
              <ProgressMeter
                label="Weekly"
                percent={percentRemaining(usage.seven_day)}
              />
              <TimeCountdown resetsAt={usage.seven_day.resets_at} />
            </View>
          )}

          {usage.seven_day_sonnet && (
            <View style={styles.section}>
              <ProgressMeter
                label="Sonnet"
                percent={percentRemaining(usage.seven_day_sonnet)}
              />
              <TimeCountdown resetsAt={usage.seven_day_sonnet.resets_at} />
            </View>
          )}

          {usage.seven_day_opus && (
            <View style={styles.section}>
              <ProgressMeter
                label="Opus"
                percent={percentRemaining(usage.seven_day_opus)}
              />
              <TimeCountdown resetsAt={usage.seven_day_opus.resets_at} />
            </View>
          )}

          {usage.extra_usage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Extra Usage</Text>
              <ProgressMeter
                label={`$${(usage.extra_usage.used_credits / 100).toFixed(2)} / $${(usage.extra_usage.monthly_limit / 100).toFixed(2)}`}
                percent={
                  (1 - usage.extra_usage.used_credits / Math.max(usage.extra_usage.monthly_limit, 1)) * 100
                }
              />
            </View>
          )}
        </>
      ) : (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Usage data requires a Claude Max subscription with OAuth authentication.
            If you're using API keys, usage tracking is not available.
          </Text>
        </View>
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
      backgroundColor: c.primaryBg20,
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
      backgroundColor: c.primaryBg10,
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
