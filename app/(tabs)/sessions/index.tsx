import { useState } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionsList } from '../../../lib/api';
import { SessionCard } from '../../../components/SessionCard';
import { FilterChips } from '../../../components/FilterChips';
import { Colors, FontSize, Spacing } from '../../../constants/theme';
import type { SessionStatus } from '../../../lib/types';

const FILTERS = [
  { label: 'All', value: null },
  { label: 'Running', value: 'running' },
  { label: 'Awaiting', value: 'awaiting_approval' },
  { label: 'Completed', value: 'completed' },
];

export default function SessionListScreen() {
  const [filter, setFilter] = useState<string | null>(null);
  const { data: sessions, isLoading, refetch } = useSessionsList(
    filter as SessionStatus | undefined
  );

  return (
    <View style={styles.container}>
      <FilterChips options={FILTERS} selected={filter} onSelect={setFilter} />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : !sessions?.length ? (
        <View style={styles.empty}>
          <Ionicons name="terminal-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No sessions yet</Text>
          <Text style={styles.emptyHint}>Create a session to get started</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => <SessionCard session={item} />}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingVertical: Spacing.sm }}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/sessions/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyText: { fontSize: FontSize.lg, color: Colors.textMuted, fontWeight: '600' },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
