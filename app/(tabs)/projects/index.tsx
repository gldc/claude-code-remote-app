import { View, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProjectsList } from '../../../lib/api';
import { ProjectCard } from '../../../components/ProjectCard';
import { Colors, FontSize, Spacing } from '../../../constants/theme';

export default function ProjectListScreen() {
  const { data: projects, isLoading, refetch } = useProjectsList();

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      ) : !projects?.length ? (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No projects found</Text>
          <Text style={styles.emptyHint}>Configure scan directories in Settings</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <ProjectCard project={item} />}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingVertical: Spacing.sm }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyText: { fontSize: FontSize.lg, color: Colors.textMuted, fontWeight: '600' },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted },
});
