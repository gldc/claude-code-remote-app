import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useUsageHistory } from '../../../lib/api';
import { TrendChart } from '../../../components/TrendChart';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../../../constants/theme';

export default function AnalyticsScreen() {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const { data: history, refetch, isLoading } = useUsageHistory(7);

  // Group history entries by day, average percent_remaining
  const chartData = (() => {
    if (!history?.length) return [];
    const byDay = new Map<string, number[]>();
    for (const entry of history) {
      const day = entry.updated_at.slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(100 - (entry.five_hour?.utilization ?? 100));
    }
    return Array.from(byDay.entries())
      .map(([date, values]) => ({
        date,
        value: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <Text style={styles.sectionTitle}>Session Usage (7-day trend)</Text>
      <View style={styles.chartCard}>
        {chartData.length > 0 ? (
          <TrendChart data={chartData} height={160} type="line" />
        ) : (
          <Text style={styles.emptyText}>No usage data yet</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Weekly Usage Trend</Text>
      <View style={styles.chartCard}>
        {(() => {
          if (!history?.length) return <Text style={styles.emptyText}>No data</Text>;
          const byDay = new Map<string, number[]>();
          for (const entry of history) {
            const day = entry.updated_at.slice(0, 10);
            if (!byDay.has(day)) byDay.set(day, []);
            byDay.get(day)!.push(100 - (entry.seven_day?.utilization ?? 100));
          }
          const data = Array.from(byDay.entries())
            .map(([date, values]) => ({
              date,
              value: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
          return <TrendChart data={data} height={160} type="bar" />;
        })()}
      </View>

      <View style={{ height: Spacing.xxl * 2 }} />
    </ScrollView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: Spacing.lg },
    sectionTitle: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    chartCard: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      minHeight: 100,
      justifyContent: 'center',
    },
    emptyText: { fontSize: FontSize.md, color: c.textMuted, textAlign: 'center' },
  });
