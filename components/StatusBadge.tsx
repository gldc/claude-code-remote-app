import { View, Text, StyleSheet } from 'react-native';
import { useColors, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { SessionStatus } from '../lib/types';

interface Props {
  status: SessionStatus;
  minimal?: boolean;
}

export function StatusBadge({ status, minimal }: Props) {
  const colors = useColors();
  const config = getStatusConfig(colors)[status] || { color: colors.textMuted, label: status };
  return (
    <View style={[styles.badge, !minimal && { backgroundColor: config.color + '14' }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function getStatusConfig(c: ColorPalette): Record<SessionStatus, { color: string; label: string }> {
  return {
    created: { color: c.textMuted, label: 'Created' },
    running: { color: c.success, label: 'Running' },
    idle: { color: c.primary, label: 'Idle' },
    awaiting_approval: { color: c.warning, label: 'Awaiting' },
    paused: { color: c.textMuted, label: 'Paused' },
    completed: { color: c.textMuted, label: 'Done' },
    error: { color: c.error, label: 'Error' },
  };
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
