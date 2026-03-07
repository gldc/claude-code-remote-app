import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionsList } from '../../../lib/api';
import { SessionCard } from '../../../components/SessionCard';
import { Colors, FontSize, Spacing } from '../../../constants/theme';

export default function ProjectDetailScreen() {
  const { id, path } = useLocalSearchParams<{ id: string; path: string }>();
  const decodedPath = path ? decodeURIComponent(path) : '';
  const projectName = decodedPath.split('/').pop() || 'Project';
  const { data: sessions } = useSessionsList();

  const projectSessions = sessions?.filter((s) => s.project_dir === decodedPath) || [];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: projectName }} />
      <View style={styles.header}>
        <Text style={styles.path}>{decodedPath}</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push(`/(tabs)/sessions/create?projectDir=${encodeURIComponent(decodedPath)}`)}
        >
          <Ionicons name="add-circle" size={20} color={Colors.primary} />
          <Text style={styles.newButtonText}>New Session</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={projectSessions}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <SessionCard session={item} />}
        contentContainerStyle={{ paddingVertical: Spacing.sm }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No sessions for this project</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  path: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  newButtonText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600' },
  empty: { padding: Spacing.xxl, alignItems: 'center' },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
