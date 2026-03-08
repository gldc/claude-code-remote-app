import { useCallback } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionsList, useDeleteSession, useArchiveSession } from '../../../lib/api';
import { SessionCard } from '../../../components/SessionCard';
import { CreateSessionSheet } from '../../../components/CreateSessionSheet';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing } from '../../../constants/theme';
import type { SessionSummary } from '../../../lib/types';

export default function ProjectDetailScreen() {
  const { id, path } = useLocalSearchParams<{ id: string; path: string }>();
  const decodedPath = path ? decodeURIComponent(path) : '';
  const projectName = decodedPath.split('/').pop() || 'Project';
  const { data: sessions } = useSessionsList();
  const deleteSession = useDeleteSession();
  const archiveSession = useArchiveSession();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const projectSessions = sessions?.filter((s) => s.project_dir === decodedPath) || [];

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
      <Stack.Screen options={{ title: projectName }} />

      <View style={styles.pathBar}>
        <Ionicons name="folder-outline" size={14} color={colors.textMuted} />
        <Text style={styles.pathText} numberOfLines={1}>{decodedPath}</Text>
      </View>

      <FlatList
        data={projectSessions}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="terminal-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptyHint}>Pull up to start one</Text>
          </View>
        }
      />

      <CreateSessionSheet projectDir={decodedPath} />
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    pathBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.cardBorder,
    },
    pathText: { fontSize: FontSize.xs, color: c.textMuted, flex: 1 },
    listContent: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      paddingBottom: 80,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    emptyText: { fontSize: FontSize.lg, color: c.textMuted, fontWeight: '600' },
    emptyHint: { fontSize: FontSize.sm, color: c.textMuted },
  });
