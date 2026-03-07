import { useEffect, useRef } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession, usePauseSession, useSendPrompt } from '../../../lib/api';
import { useSessionStream } from '../../../lib/websocket';
import { MessageCard } from '../../../components/MessageCard';
import { InputBar } from '../../../components/InputBar';
import { StatusBadge } from '../../../components/StatusBadge';
import { Colors, FontSize, Spacing } from '../../../constants/theme';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading } = useSession(id);
  const { messages, isConnected } = useSessionStream(id);
  const sendPrompt = useSendPrompt(id);
  const pauseSession = usePauseSession(id);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  if (isLoading || !session) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const isActive = session.status === 'running' || session.status === 'awaiting_approval';
  const canSend = session.status === 'running' || session.status === 'paused';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: session.name,
          headerRight: () => (
            <View style={styles.headerRight}>
              <StatusBadge status={session.status} />
              {isActive && (
                <TouchableOpacity onPress={() => pauseSession.mutate()}>
                  <Ionicons name="pause-circle" size={24} color={Colors.warning} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {session.project_dir.split('/').pop()} | ${session.total_cost_usd.toFixed(2)}
        </Text>
        <View style={[styles.connDot, { backgroundColor: isConnected ? Colors.success : Colors.error }]} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <MessageCard message={item} sessionId={id} />}
        contentContainerStyle={{ paddingVertical: Spacing.sm }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isActive ? 'Waiting for output...' : 'No messages yet'}
            </Text>
          </View>
        }
      />

      {canSend && (
        <InputBar
          onSend={(text) => sendPrompt.mutate(text)}
          disabled={sendPrompt.isPending}
          placeholder="Send a follow-up prompt..."
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  infoText: { fontSize: FontSize.xs, color: Colors.textMuted },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  empty: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
