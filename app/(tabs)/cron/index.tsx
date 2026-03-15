import { useRef, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text } from 'react-native';
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
      <FilterChips options={FILTER_OPTIONS} selected={filter} onSelect={setFilter} />
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
      <TouchableOpacity
        style={styles.fab}
        onPress={() => sheetRef.current?.snapToIndex(1)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.buttonText} />
      </TouchableOpacity>
      <CreateCronJobSheet ref={sheetRef} />
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    list: { paddingTop: Spacing.sm, paddingBottom: 100 },
    empty: { alignItems: 'center', paddingTop: 100, gap: Spacing.md },
    emptyText: { fontSize: FontSize.md, color: c.textMuted },
    fab: {
      position: 'absolute', bottom: Spacing.xl, right: Spacing.xl,
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center',
      elevation: 4, shadowColor: c.shadowColor, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25, shadowRadius: 4,
    },
  });
