import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { Project, ProjectType } from '../lib/types';

const TYPE_ICONS: Record<ProjectType, string> = {
  python: 'logo-python',
  node: 'logo-nodejs',
  rust: 'hardware-chip',
  go: 'code-slash',
  unknown: 'folder',
};

export function ProjectCard({ project }: { project: Project }) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/projects/${project.id}?path=${encodeURIComponent(project.path)}`)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={(TYPE_ICONS[project.type] || 'folder') as any}
        size={24}
        color={colors.primary}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{project.name}</Text>
        <Text style={styles.path} numberOfLines={1}>{project.path}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: c.cardBorder,
      gap: Spacing.md,
    },
    info: { flex: 1 },
    name: { fontSize: FontSize.md, fontWeight: '600', color: c.text },
    path: { fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 },
  });
