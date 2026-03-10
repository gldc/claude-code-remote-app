import { View, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useProjectsList } from '../../../lib/api';
import { ProjectCard } from '../../../components/ProjectCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { FAB } from '../../../components/ui/FAB';
import { useColors, useThemedStyles, type ColorPalette, Spacing } from '../../../constants/theme';

export default function ProjectListScreen() {
  const { data: projects, isLoading, refetch } = useProjectsList();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <LoadingState />
      ) : !projects?.length ? (
        <EmptyState
          icon="folder-open-outline"
          title="No projects found"
          hint="Create one or configure scan directories in Settings"
        />
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
      <FAB onPress={() => router.push('/(tabs)/projects/create')} />
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
  });
