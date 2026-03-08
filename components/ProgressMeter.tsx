import React from 'react';
import { View, Text, StyleSheet, type DimensionValue } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, FontSize } from '../constants/theme';

interface ProgressMeterProps {
  label: string;
  percent: number;
  subtitle?: string;
  reservePercent?: number;
  size?: 'sm' | 'md';
}

function getBarColor(percent: number, colors: ColorPalette): string {
  if (percent > 50) return colors.success;
  if (percent > 20) return colors.warning;
  return colors.error;
}

export const ProgressMeter = React.memo(function ProgressMeter({
  label, percent, subtitle, reservePercent, size = 'md',
}: ProgressMeterProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const barHeight = size === 'sm' ? 4 : 8;
  const barColor = getBarColor(percent, colors);
  const fillWidth = `${Math.max(0, Math.min(100, percent))}%` as DimensionValue;
  const reserveWidth = (reservePercent ? `${Math.min(reservePercent, 100 - percent)}%` : '0%') as DimensionValue;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.percent}>{Math.round(percent)}% left</Text>
      </View>
      <View style={[styles.track, { height: barHeight }]}>
        <View style={[styles.fill, { width: fillWidth, backgroundColor: barColor }]} />
        {reservePercent ? (
          <View style={[styles.reserve, { width: reserveWidth, backgroundColor: barColor, opacity: 0.4 }]} />
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: { gap: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: FontSize.md, fontWeight: '600', color: c.text },
  percent: { fontSize: FontSize.sm, color: c.textMuted },
  track: { backgroundColor: c.cardBorder, borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  fill: { borderRadius: 4 },
  reserve: { borderRadius: 4 },
  subtitle: { fontSize: FontSize.xs, color: c.textMuted },
});
