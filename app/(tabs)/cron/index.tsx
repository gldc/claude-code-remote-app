import { useRef, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { useCronJobsList, useDeleteCronJob, useToggleCronJob } from '../../../lib/api';
import { CronJobCard } from '../../../components/CronJobCard';
import { CreateCronJobSheet } from '../../../components/CreateCronJobSheet';
import { FilterChips } from '../../../components/FilterChips';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../../constants/theme';
import type { CronJob } from '../../../lib/types';

const FILTER_OPTIONS = [
  { label: 'All', value: null },
  { label: 'Active', value: 'active' },
  { label: 'Disabled', value: 'disabled' },
];

export default function CronListScreen() {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const sheetRef = useRef<BottomSheet>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const { data: jobs, isLoading } = useCronJobsList();
  const deleteMutation = useDeleteCronJob();
  const toggleMutation = useToggleCronJob();

  const filteredJobs = (jobs ?? []).filter((job) => {
    if (filter === 'active') return job.enabled;
    if (filter === 'disabled') return !job.enabled;
    return true;
  });

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleToggle = useCallback((id: string) => {
    toggleMutation.mutate(id);
  }, [toggleMutation]);

  const renderItem = useCallback(({ item }: { item: CronJob }) => (
    <CronJobCard job={item} onDelete={handleDelete} onToggle={handleToggle} />
  ), [handleDelete, handleToggle]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="timer-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading...' : 'No cron jobs yet'}
            </Text>
          </View>
        }
      />
      <View style={styles.filterBar}>
        <FilterChips options={FILTER_OPTIONS} selected={filter} onSelect={setFilter} />
      </View>
      <CreateCronJobSheet ref={sheetRef} />
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    list: { flexGrow: 1, justifyContent: 'flex-end', paddingBottom: 100 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
    emptyText: { fontSize: FontSize.lg, color: c.textMuted, fontWeight: '600' },
    filterBar: {
      position: 'absolute',
      bottom: 50,
      left: 0,
      right: 0,
      backgroundColor: c.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.cardBorder,
      paddingBottom: Spacing.xs,
    },
  });
