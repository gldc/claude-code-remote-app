import { useEffect, useRef, useCallback } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Share } from 'react-native';
import type { SlashCommand } from '../../../constants/commands';
import { useSession, usePauseSession, useSendPrompt, useExportSession, useAddCollaborator, useRemoveCollaborator } from '../../../lib/api';
import { useSessionStream } from '../../../lib/websocket';
import { useAppStore } from '../../../lib/store';
import { MessageCard } from '../../../components/MessageCard';
import { InputBar } from '../../../components/InputBar';
import { StatusBadge } from '../../../components/StatusBadge';
import { GitPanel } from '../../../components/GitPanel';
import { AvatarRow } from '../../../components/AvatarRow';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing } from '../../../constants/theme';
import type { WSMessageData } from '../../../lib/types';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading } = useSession(id);
  const { messages, isConnected } = useSessionStream(id);
  const sendPrompt = useSendPrompt(id);
  const pauseSession = usePauseSession(id);
  const exportSession = useExportSession(id);
  const addCollaborator = useAddCollaborator(id);
  const removeCollaborator = useRemoveCollaborator(id);
  const appendMessage = useAppStore((s) => s.appendMessage);
  const clearMessages = useAppStore((s) => s.clearMessages);
  const flatListRef = useRef<FlatList>(null);
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const handleCommand = useCallback((command: SlashCommand) => {
    switch (command.name) {
      case 'clear':
        clearMessages(id);
        break;
      case 'cost':
        Alert.alert('Session Cost', `$${session?.total_cost_usd.toFixed(4) ?? '0.00'}`);
        break;
    }
  }, [id, clearMessages, session?.total_cost_usd]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const isFirstAssistantInGroup = useCallback(
    (index: number) => {
      if (messages[index]?.type !== 'assistant_text') return false;
      if (index === 0) return true;
      const prev = messages[index - 1];
      return prev.type === 'user_message' || prev.type === 'status_change';
    },
    [messages],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: WSMessageData; index: number }) => (
      <MessageCard
        message={item}
        sessionId={id}
        isFirstInGroup={isFirstAssistantInGroup(index)}
      />
    ),
    [id, isFirstAssistantInGroup],
  );

  if (isLoading || !session) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const isActive = session.status === 'running' || session.status === 'awaiting_approval';
  const canSend = session.status !== 'running' && session.status !== 'awaiting_approval';
  const isThinking = session.status === 'running';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitleText} numberOfLines={1}>{session.name}</Text>
              <StatusBadge status={session.status} />
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <TouchableOpacity
                onPress={() =>
                  exportSession.mutate(undefined, {
                    onSuccess: (data) => Share.share({ message: JSON.stringify(data, null, 2) }),
                  })
                }
              >
                <Ionicons name="share-outline" size={22} color={colors.text} />
              </TouchableOpacity>
              {isActive && (
                <TouchableOpacity onPress={() => pauseSession.mutate()}>
                  <Ionicons name="pause-circle" size={24} color={colors.warning} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />

      <View style={styles.infoBar}>
        <Text style={styles.infoText} numberOfLines={1}>
          {session.project_dir.split('/').pop()}
          {session.git_branch ? ` (${session.git_branch})` : ''}
          {' | '}${session.total_cost_usd.toFixed(2)}
          {session.current_model ? ` | ${session.current_model}` : ''}
          {session.context_percent > 0 ? ` | ${session.context_percent}% ctx` : ''}
        </Text>
        <View style={[styles.connDot, { backgroundColor: isConnected ? colors.success : colors.error }]} />
      </View>

      {session.collaborators && session.collaborators.length > 0 && (
        <View style={styles.collabBar}>
          <AvatarRow
            identities={session.collaborators}
            onAdd={() => {
              Alert.prompt('Add Collaborator', 'Enter Tailscale identity', (identity) => {
                if (identity?.trim()) addCollaborator.mutate(identity.trim());
              });
            }}
            onRemove={(identity) => {
              Alert.alert('Remove Collaborator', `Remove ${identity}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => removeCollaborator.mutate(identity) },
              ]);
            }}
          />
        </View>
      )}

      <GitPanel sessionId={id} />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isThinking ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isThinking ? (
            <View style={styles.thinkingRow}>
              <View style={styles.thinkingAvatarCol}>
                <View style={styles.thinkingAvatar}>
                  <Text style={styles.thinkingAvatarText}>C</Text>
                </View>
              </View>
              <View style={styles.thinkingDots}>
                <ActivityIndicator size="small" color={colors.textMuted} />
                <Text style={styles.thinkingText}>Thinking...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {canSend && (
        <InputBar
          onSend={(text) => {
            appendMessage(id, {
              type: 'user_message',
              data: { text },
              timestamp: new Date().toISOString(),
            });
            sendPrompt.mutate(text);
          }}
          onCommand={handleCommand}
          disabled={sendPrompt.isPending}
          placeholder="Message Claude..."
        />
      )}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    headerTitleText: { fontSize: FontSize.lg, fontWeight: '600', color: c.text, flexShrink: 1 },
    infoBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.cardBorder,
    },
    infoText: { fontSize: FontSize.xs, color: c.textMuted },
    connDot: { width: 8, height: 8, borderRadius: 4 },
    collabBar: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.cardBorder,
    },
    listContent: {
      paddingVertical: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    empty: {
      padding: Spacing.xxl * 2,
      alignItems: 'center',
    },
    emptyText: { fontSize: FontSize.md, color: c.textMuted },
    thinkingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    thinkingAvatarCol: {
      width: 40,
      alignItems: 'center',
    },
    thinkingAvatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thinkingAvatarText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    thinkingDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: c.card,
      borderRadius: 16,
      shadowColor: c.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    thinkingText: {
      fontSize: FontSize.sm,
      color: c.textMuted,
    },
  });
