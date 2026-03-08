import { useState, useCallback } from 'react';
import {
  View, FlatList, Text, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionsList, useDeleteSession, useArchiveSession } from '../../../lib/api';
import { SessionCard } from '../../../components/SessionCard';
import { FilterChips } from '../../../components/FilterChips';
import { CreateSessionSheet } from '../../../components/CreateSessionSheet';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing } from '../../../constants/theme';
import type { SessionStatus, SessionSummary } from '../../../lib/types';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Running', value: 'running' },
  { label: 'Idle', value: 'idle' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' },
];

export default function SessionListScreen() {
  const [filter, setFilter] = useState<string | null>('all');
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const isArchived = filter === 'archived';
  const statusFilter = (filter && filter !== 'all' && filter !== 'archived')
    ? filter as SessionStatus
    : undefined;
  const archivedFilter = isArchived ? true : filter === 'all' ? false : undefined;

  const { data: sessions, isLoading, refetch } = useSessionsList(statusFilter, archivedFilter);
  const deleteSession = useDeleteSession();
  const archiveSession = useArchiveSession();

  const handleDelete = useCallback(
    (id: string) => deleteSession.mutate(id),
    [deleteSession],
  );

  const handleArchive = useCallback(
    (id: string, archived: boolean) => archiveSession.mutate({ id, archived }),
    [archiveSession],
  );

  const renderItem = useCallback(
    ({ item }: { item: SessionSummary }) => (
      <SessionCard session={item} onDelete={handleDelete} onArchive={handleArchive} />
    ),
    [handleDelete, handleArchive],
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={sessions ?? []}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={isArchived ? 'archive-outline' : 'terminal-outline'}
                size={48}
                color={colors.textMuted}
              />
              <Text style={styles.emptyText}>
                {isArchived ? 'No archived sessions' : 'No sessions yet'}
              </Text>
              {!isArchived && (
                <Text style={styles.emptyHint}>Pull up to start one</Text>
              )}
            </View>
          }
        />
      )}

      <View style={styles.filterBar}>
        <FilterChips options={FILTERS} selected={filter} onSelect={setFilter} />
      </View>

      <CreateSessionSheet />
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    loader: { flex: 1, justifyContent: 'center' },
    listContent: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      paddingBottom: 100,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    emptyText: { fontSize: FontSize.lg, color: c.textMuted, fontWeight: '600' },
    emptyHint: { fontSize: FontSize.sm, color: c.textMuted },
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
