import { useCallback } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow } from '../../../../lib/api';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../../../../constants/theme';
import type { Workflow, WorkflowStatus } from '../../../../lib/types';

function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  const colors = useColors();
  const config: Record<WorkflowStatus, { color: string; label: string }> = {
    created: { color: colors.textMuted, label: 'Created' },
    running: { color: colors.success, label: 'Running' },
    completed: { color: colors.textMuted, label: 'Done' },
    error: { color: colors.error, label: 'Error' },
  };
  const { color, label } = config[status] ?? { color: colors.textMuted, label: status };
  return (
    <View style={[badgeStyles.badge, { backgroundColor: color + '14' }]}>
      <View style={[badgeStyles.dot, { backgroundColor: color }]} />
      <Text style={[badgeStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 3,
    borderRadius: BorderRadius.xl, gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: FontSize.xs, fontWeight: '600' },
});

export default function WorkflowListScreen() {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const router = useRouter();
  const { data: workflows, isLoading, refetch } = useWorkflows();
  const createWorkflow = useCreateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();

  const handleCreate = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt('New Workflow', 'Enter a name for the workflow:', (name) => {
        if (name?.trim()) {
          createWorkflow.mutate({ name: name.trim(), steps: [] });
        }
      });
    } else {
      // Android fallback — just create with default name
      createWorkflow.mutate({ name: `Workflow ${Date.now()}`, steps: [] });
    }
  }, [createWorkflow]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete Workflow', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteWorkflow.mutate(id) },
      ]);
    },
    [deleteWorkflow],
  );

  const renderItem = useCallback(
    ({ item }: { item: Workflow }) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/sessions/workflows/${item.id}`)}
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <WorkflowStatusBadge status={item.status} />
        </View>
        <Text style={styles.cardMeta}>
          {item.steps.length} step{item.steps.length !== 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>
    ),
    [styles, router, handleDelete],
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={workflows ?? []}
          keyExtractor={(w) => w.id}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="git-merge-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No workflows yet</Text>
              <Text style={styles.emptyHint}>Create one to orchestrate sessions</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={handleCreate}>
        <Ionicons name="add" size={28} color={colors.buttonText} />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    loader: { flex: 1, justifyContent: 'center' },
    listContent: { flexGrow: 1, padding: Spacing.lg },
    card: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    cardName: { fontSize: FontSize.md, fontWeight: '600', color: c.text, flex: 1, marginRight: Spacing.sm },
    cardMeta: { fontSize: FontSize.sm, color: c.textMuted },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingTop: 100,
    },
    emptyText: { fontSize: FontSize.lg, color: c.textMuted, fontWeight: '600' },
    emptyHint: { fontSize: FontSize.sm, color: c.textMuted },
    fab: {
      position: 'absolute',
      right: Spacing.xl,
      bottom: Spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
  });
