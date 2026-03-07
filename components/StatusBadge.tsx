import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { SessionStatus } from '../lib/types';

const STATUS_COLORS: Record<SessionStatus, string> = {
  created: Colors.textMuted,
  running: Colors.success,
  awaiting_approval: Colors.warning,
  paused: Colors.textMuted,
  completed: Colors.primary,
  error: Colors.error,
};

const STATUS_LABELS: Record<SessionStatus, string> = {
  created: 'Created',
  running: 'Running',
  awaiting_approval: 'Awaiting',
  paused: 'Paused',
  completed: 'Completed',
  error: 'Error',
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  const color = STATUS_COLORS[status] || Colors.textMuted;
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
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
    textTransform: 'uppercase',
  },
});
