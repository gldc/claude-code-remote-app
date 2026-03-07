import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBadge } from './StatusBadge';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { SessionSummary } from '../lib/types';

export function SessionCard({ session }: { session: SessionSummary }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/sessions/${session.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{session.name}</Text>
        <StatusBadge status={session.status} />
      </View>
      <Text style={styles.project} numberOfLines={1}>
        {session.project_dir.split('/').pop()}
      </Text>
      {session.last_message_preview && (
        <Text style={styles.preview} numberOfLines={2}>
          {session.last_message_preview}
        </Text>
      )}
      <View style={styles.footer}>
        <Text style={styles.cost}>${session.total_cost_usd.toFixed(2)}</Text>
        <Text style={styles.time}>
          {new Date(session.updated_at).toLocaleTimeString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  project: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  preview: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cost: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  time: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
