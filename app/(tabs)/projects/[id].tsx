import { useCallback, useEffect, useRef } from 'react';
import { View, FlatList, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionsList, useDeleteSession, useArchiveSession, useProjectsList } from '../../../lib/api';
import { SessionCard } from '../../../components/SessionCard';
import { CreateSessionSheet } from '../../../components/CreateSessionSheet';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../../constants/theme';
import type { SessionSummary } from '../../../lib/types';
import BottomSheet from '@gorhom/bottom-sheet';

export default function ProjectDetailScreen() {
  const { id, path, newProject } = useLocalSearchParams<{ id: string; path: string; newProject?: string }>();
  const decodedPath = path ? decodeURIComponent(path) : '';
  const projectName = decodedPath.split('/').pop() || 'Project';
  const { data: sessions } = useSessionsList();
  const { data: projects } = useProjectsList();
  const deleteSession = useDeleteSession();
  const archiveSession = useArchiveSession();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const sheetRef = useRef<BottomSheet>(null);

  const project = projects?.find((p) => p.id === id);
  const isCloning = project?.status === 'cloning';
  const isError = project?.status === 'error';

  const projectSessions = sessions?.filter((s) => s.project_dir === decodedPath) || [];

  // Auto-expand session sheet for new projects once ready
  useEffect(() => {
    if (newProject === 'true' && project?.status === 'ready') {
      const timer = setTimeout(() => sheetRef.current?.snapToIndex(1), 300);
      return () => clearTimeout(timer);
    }
  }, [newProject, project?.status]);

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
      <Stack.Screen
        options={{
          title: projectName,
          headerRight: () =>
            !isCloning && !isError ? (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/projects/terminal' as any,
                    params: { id },
                  })
                }
                style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.xs }}
                activeOpacity={0.7}
              >
                <Ionicons name="terminal-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            ) : null,
        }}
      />

      <View style={styles.pathBar}>
        <Ionicons name="folder-outline" size={14} color={colors.textMuted} />
        <Text style={styles.pathText} numberOfLines={1}>{decodedPath}</Text>
      </View>

      {isCloning ? (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>Cloning repository...</Text>
          <Text style={styles.statusHint}>This may take a moment</Text>
        </View>
      ) : isError ? (
        <View style={styles.statusContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.statusText}>Clone failed</Text>
          <Text style={styles.errorText}>{project?.error_message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.7}
            onPress={() => {
              // Re-clone: we need the original URL which we don't have stored.
              // Navigate back to create screen in clone mode instead.
              router.replace('/(tabs)/projects/create?mode=clone');
            }}
          >
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
      )}

      {!isCloning && !isError && (
        <CreateSessionSheet ref={sheetRef} projectDir={decodedPath} />
      )}
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
    statusContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
      padding: Spacing.xl,
    },
    statusText: {
      fontSize: FontSize.lg, fontWeight: '600', color: c.text,
    },
    statusHint: {
      fontSize: FontSize.sm, color: c.textMuted,
    },
    errorText: {
      fontSize: FontSize.sm, color: c.error, textAlign: 'center',
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.primary,
      marginTop: Spacing.sm,
    },
    retryButtonText: {
      fontSize: FontSize.md, fontWeight: '600', color: c.primary,
    },
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
