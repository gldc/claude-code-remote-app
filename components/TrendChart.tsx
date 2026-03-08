import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Line, Text as SvgText } from 'react-native-svg';
import { useColors, useThemedStyles, type ColorPalette } from '../constants/theme';

interface TrendChartProps {
  data: { date: string; value: number }[];
  height?: number;
  type?: 'bar' | 'line';
}

export const TrendChart = React.memo(function TrendChart({
  data, height = 120, type = 'bar',
}: TrendChartProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  if (!data.length) return null;

  const padding = { top: 10, right: 10, bottom: 24, left: 10 };
  const chartWidth = Math.max(data.length * 40, 200);
  const chartHeight = height - padding.top - padding.bottom;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  const barWidth = Math.max(12, (chartWidth - padding.left - padding.right) / data.length - 4);

  const getX = (i: number) => padding.left + i * ((chartWidth - padding.left - padding.right) / data.length) + barWidth / 2;
  const getY = (v: number) => padding.top + chartHeight - (v / maxVal) * chartHeight;

  let linePath = '';
  let areaPath = '';
  if (type === 'line' && data.length > 1) {
    linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.value)}`).join(' ');
    areaPath = linePath + ` L${getX(data.length - 1)},${padding.top + chartHeight} L${getX(0)},${padding.top + chartHeight} Z`;
  }

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        <Line x1={padding.left} y1={padding.top + chartHeight} x2={chartWidth - padding.right} y2={padding.top + chartHeight} stroke={colors.cardBorder} strokeWidth={1} />

        {type === 'bar' ? data.map((d, i) => {
          const barH = (d.value / maxVal) * chartHeight;
          return (
            <Rect
              key={i}
              x={getX(i) - barWidth / 2}
              y={padding.top + chartHeight - barH}
              width={barWidth}
              height={barH}
              rx={3}
              fill={colors.primary}
              opacity={0.8}
            />
          );
        }) : (
          <>
            <Path d={areaPath} fill={colors.primary} opacity={0.15} />
            <Path d={linePath} stroke={colors.primary} strokeWidth={2} fill="none" />
          </>
        )}

        {data.map((d, i) => (
          <SvgText
            key={`label-${i}`}
            x={getX(i)}
            y={height - 4}
            fontSize={9}
            fill={colors.textMuted}
            textAnchor="middle"
          >
            {d.date.slice(-5)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: { overflow: 'hidden' },
});
