import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCronJob, useCronJobHistory, useToggleCronJob, useTriggerCronJob } from '../../../lib/api';
import { StatusBadge } from '../../../components/StatusBadge';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../../constants/theme';
import { shadowCard } from '../../../constants/shadows';
import type { CronJobRun, SessionStatus } from '../../../lib/types';

export default function CronDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const { data: job } = useCronJob(id);
  const { data: history } = useCronJobHistory(id);
  const toggleMutation = useToggleCronJob();
  const triggerMutation = useTriggerCronJob();

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const handleTrigger = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    triggerMutation.mutate(id, {
      onSuccess: () => Alert.alert('Triggered', 'Cron job has been triggered.'),
      onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Failed'),
    });
  };

  const statusMap: Record<string, string> = {
    success: 'completed',
    error: 'error',
    running: 'running',
    timeout: 'error',
  };

  const renderRunItem = ({ item }: { item: CronJobRun }) => (
    <TouchableOpacity
      style={styles.runCard}
      onPress={() => item.session_id && router.push(`/(tabs)/sessions/${item.session_id}`)}
      disabled={!item.session_id}
      activeOpacity={0.7}
    >
      <View style={styles.runHeader}>
        <Text style={styles.runTime}>
          {new Date(item.started_at).toLocaleString()}
        </Text>
        <StatusBadge status={(statusMap[item.status] || item.status) as SessionStatus} />
      </View>
      <View style={styles.runFooter}>
        <Text style={styles.runCost}>${item.cost_usd.toFixed(4)}</Text>
        {item.completed_at && (
          <Text style={styles.runDuration}>
            {Math.round((new Date(item.completed_at).getTime() - new Date(item.started_at).getTime()) / 1000)}s
          </Text>
        )}
      </View>
      {item.error_message && (
        <Text style={styles.runError} numberOfLines={2}>{item.error_message}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Config Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>{job.name}</Text>
          <TouchableOpacity
            onPress={() => toggleMutation.mutate(id)}
            style={[styles.toggleBadge, job.enabled ? styles.toggleEnabled : styles.toggleDisabled]}
          >
            <Text style={styles.toggleText}>{job.enabled ? 'Enabled' : 'Disabled'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.summaryDetail}>
          <Ionicons name="timer-outline" size={14} color={colors.textMuted} />{' '}
          {job.schedule} — {job.execution_mode === 'spawn' ? 'New session each run' : 'Persistent session'}
        </Text>

        {job.next_run_at && (
          <Text style={styles.summaryDetail}>
            Next run: {new Date(job.next_run_at).toLocaleString()}
          </Text>
        )}

        <TouchableOpacity style={styles.triggerButton} onPress={handleTrigger} activeOpacity={0.8}>
          <Ionicons name="play" size={18} color={colors.buttonText} />
          <Text style={styles.triggerButtonText}>Run Now</Text>
        </TouchableOpacity>
      </View>

      {/* Run History */}
      <Text style={styles.sectionTitle}>Run History</Text>
      <FlatList
        data={history ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderRunItem}
        contentContainerStyle={styles.historyList}
        ListEmptyComponent={
          <Text style={styles.emptyHistory}>No runs yet</Text>
        }
      />
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    loading: { fontSize: FontSize.md, color: c.textMuted },
    summary: {
      backgroundColor: c.card, margin: Spacing.lg, borderRadius: BorderRadius.lg,
      padding: Spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.cardBorder,
      ...shadowCard,
    },
    summaryHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    summaryTitle: { fontSize: FontSize.xl, fontWeight: '700', color: c.text, flex: 1 },
    toggleBadge: {
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xl,
    },
    toggleEnabled: { backgroundColor: c.successBg10 },
    toggleDisabled: { backgroundColor: c.errorBg10 },
    toggleText: { fontSize: FontSize.sm, fontWeight: '600', color: c.text },
    summaryDetail: { fontSize: FontSize.sm, color: c.textMuted, marginBottom: Spacing.xs },
    triggerButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, backgroundColor: c.primary, borderRadius: BorderRadius.md,
      padding: Spacing.md, marginTop: Spacing.md,
    },
    triggerButtonText: { fontSize: FontSize.md, fontWeight: '600', color: c.buttonText },
    sectionTitle: {
      fontSize: FontSize.lg, fontWeight: '700', color: c.text,
      marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm,
    },
    historyList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
    emptyHistory: {
      fontSize: FontSize.md, color: c.textMuted, textAlign: 'center', paddingTop: Spacing.xl,
    },
    runCard: {
      backgroundColor: c.card, borderRadius: BorderRadius.md, padding: Spacing.md,
      marginBottom: Spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: c.cardBorder,
    },
    runHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    runTime: { fontSize: FontSize.sm, color: c.text },
    runFooter: {
      flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs,
    },
    runCost: { fontSize: FontSize.xs, color: c.primary },
    runDuration: { fontSize: FontSize.xs, color: c.textMuted },
    runError: { fontSize: FontSize.xs, color: c.error, marginTop: Spacing.xs },
  });
