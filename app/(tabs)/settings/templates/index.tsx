import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTemplatesList } from '../../../../lib/api';
import { TemplateCard } from '../../../../components/TemplateCard';
import { Colors, FontSize, Spacing } from '../../../../constants/theme';

export default function TemplateListScreen() {
  const { data: templates, isLoading, refetch } = useTemplatesList();

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      ) : !templates?.length ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
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
        <Ionicons name="add" size={28} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
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
