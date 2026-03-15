import { useRef } from 'react';
import { TouchableOpacity, View, Text, Switch, StyleSheet, Alert, Animated } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBadge } from './StatusBadge';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { shadowCard } from '../constants/shadows';
import { describeCron } from '../lib/cron-utils';
import type { CronJob, SessionStatus } from '../lib/types';

interface Props {
  job: CronJob;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export function CronJobCard({ job, onDelete, onToggle }: Props) {
  const swipeableRef = useRef<Swipeable>(null);
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Cron Job',
      `Delete "${job.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => swipeableRef.current?.close() },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(job.id) },
      ],
    );
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
    return (
      <RectButton style={styles.deleteAction} onPress={handleDelete}>
        <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
          <Ionicons name="trash-outline" size={22} color={colors.buttonText} />
          <Text style={styles.actionText}>Delete</Text>
        </Animated.View>
      </RectButton>
    );
  };

  const statusMap: Record<string, string> = {
    success: 'completed',
    error: 'error',
    running: 'running',
    timeout: 'error',
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      <TouchableOpacity
        style={[styles.card, !job.enabled && styles.cardDisabled]}
        onPress={() => router.push(`/(tabs)/cron/${job.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Ionicons name="timer-outline" size={16} color={colors.primary} />
            <Text style={[styles.name, !job.enabled && styles.textDisabled]} numberOfLines={1}>
              {job.name}
            </Text>
          </View>
          <Switch
            value={job.enabled}
            onValueChange={() => onToggle(job.id)}
            trackColor={{ false: colors.cardBorder, true: colors.primary + '60' }}
            thumbColor={job.enabled ? colors.primary : colors.textMuted}
          />
        </View>

        <Text style={styles.schedule}>{describeCron(job.schedule)}</Text>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {job.next_run_at && (
              <Text style={styles.nextRun}>
                Next: {new Date(job.next_run_at).toLocaleString()}
              </Text>
            )}
          </View>
          {job.last_run_status && (
            <StatusBadge status={(statusMap[job.last_run_status] || job.last_run_status) as SessionStatus} />
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      ...shadowCard,
    },
    cardDisabled: { opacity: 0.5 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
    name: { fontSize: FontSize.lg, fontWeight: '600', color: c.text, flex: 1 },
    textDisabled: { color: c.textMuted },
    schedule: { fontSize: FontSize.sm, color: c.textMuted, marginBottom: Spacing.sm },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerLeft: { flex: 1 },
    nextRun: { fontSize: FontSize.xs, color: c.textSecondary },
    deleteAction: {
      backgroundColor: c.error,
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      marginBottom: Spacing.sm,
      marginRight: Spacing.lg,
      borderRadius: BorderRadius.lg,
    },
    actionContent: { alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
    actionText: { color: c.buttonText, fontSize: FontSize.xs, fontWeight: '600' },
  });
