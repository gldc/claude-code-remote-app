import { useMemo } from 'react';
import { View, FlatList, SectionList, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTemplatesList } from '../../../../lib/api';
import { TemplateCard } from '../../../../components/TemplateCard';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../../../constants/theme';

export default function TemplateListScreen() {
  const { data: templates, isLoading, refetch } = useTemplatesList();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const sections = useMemo(() => {
    if (!templates?.length) return [];
    const builtins = templates.filter((t) => t.is_builtin);
    const custom = templates.filter((t) => !t.is_builtin);
    const result = [];
    if (builtins.length > 0) result.push({ title: 'Built-in Presets', data: builtins });
    if (custom.length > 0) result.push({ title: 'Custom Templates', data: custom });
    return result;
  }, [templates]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : !templates?.length ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No templates yet</Text>
          <Text style={styles.emptyHint}>Create a template to speed up session creation</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TemplateCard template={item} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Ionicons
                name={section.title === 'Built-in Presets' ? 'star' : 'document-text-outline'}
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingVertical: Spacing.sm }}
          stickySectionHeadersEnabled={false}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/settings/templates/new')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
    emptyText: { fontSize: FontSize.lg, color: c.textMuted, fontWeight: '600' },
    emptyHint: { fontSize: FontSize.sm, color: c.textMuted },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xs,
    },
    sectionHeaderText: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    fab: {
      position: 'absolute',
      bottom: Spacing.xl,
      right: Spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: c.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  });
