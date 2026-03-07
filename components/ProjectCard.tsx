import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { Project, ProjectType } from '../lib/types';

const TYPE_ICONS: Record<ProjectType, string> = {
  python: 'logo-python',
  node: 'logo-nodejs',
  rust: 'hardware-chip',
  go: 'code-slash',
  unknown: 'folder',
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/projects/${project.id}?path=${encodeURIComponent(project.path)}`)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={(TYPE_ICONS[project.type] || 'folder') as any}
        size={24}
        color={Colors.primary}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{project.name}</Text>
        <Text style={styles.path} numberOfLines={1}>{project.path}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  path: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});
