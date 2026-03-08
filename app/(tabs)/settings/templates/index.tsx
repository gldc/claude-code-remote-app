import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTemplatesList } from '../../../../lib/api';
import { TemplateCard } from '../../../../components/TemplateCard';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing } from '../../../../constants/theme';

export default function TemplateListScreen() {
  const { data: templates, isLoading, refetch } = useTemplatesList();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

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
        <FlatList
          data={templates}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TemplateCard template={item} />}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingVertical: Spacing.sm }}
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
