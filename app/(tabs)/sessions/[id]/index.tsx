import { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Share } from 'react-native';
import type { SlashCommand } from '../../../../constants/commands';
import { useSession, usePauseSession, useSendPrompt, useExportSession, useShowCost, useUploadFiles } from '../../../../lib/api';
import { useSessionStream } from '../../../../lib/websocket';
import { useAppStore } from '../../../../lib/store';
import { MessageCard } from '../../../../components/MessageCard';
import { InputBar } from '../../../../components/InputBar';
import type { PendingAttachment } from '../../../../components/AttachmentPreview';
import { StatusBadge } from '../../../../components/StatusBadge';
import { GitPanel } from '../../../../components/GitPanel';
import { SessionInfoBar } from '../../../../components/SessionInfoBar';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing } from '../../../../constants/theme';
import { shadowCard } from '../../../../constants/shadows';
import type { WSMessageData } from '../../../../lib/types';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading } = useSession(id);
  const showCost = useShowCost();
  const { messages, isConnected } = useSessionStream(id);
  const sendPrompt = useSendPrompt(id);
  const uploadFiles = useUploadFiles(id);
  const pauseSession = usePauseSession(id);
  const exportSession = useExportSession(id);
  const router = useRouter();
  const clearMessages = useAppStore((s) => s.clearMessages);
  const pendingSkillInsert = useAppStore((s) => s.pendingSkillInsert);
  const setPendingSkillInsert = useAppStore((s) => s.setPendingSkillInsert);
  const flatListRef = useRef<FlatList>(null);
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  // Reverse messages for inverted FlatList (newest at index 0 = visual bottom)
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const handleCommand = useCallback((command: SlashCommand) => {
    switch (command.name) {
      case 'clear':
        clearMessages(id);
        break;
      case 'cost':
        if (showCost) {
          Alert.alert('Session Cost', `$${session?.total_cost_usd.toFixed(4) ?? '0.00'}`);
        } else {
          Alert.alert('Session Cost', 'Cost display is disabled in server config');
        }
        break;
    }
  }, [id, clearMessages, session?.total_cost_usd, showCost]);

  useEffect(() => {
    if (pendingSkillInsert) {
      setPendingSkillInsert(null);
    }
  }, [pendingSkillInsert, setPendingSkillInsert]);

  const isFirstAssistantInGroup = useCallback(
    (index: number) => {
      // In reversed array, the "previous" message in chronological order is at index + 1
      if (reversedMessages[index]?.type !== 'assistant_text') return false;
      if (index === reversedMessages.length - 1) return true;
      const prev = reversedMessages[index + 1];
      return prev.type === 'user_message' || prev.type === 'status_change';
    },
    [reversedMessages],
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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
              <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/sessions/[id]/settings', params: { id } })}>
                <Ionicons name="ellipsis-horizontal-circle" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <SessionInfoBar
        projectDir={session.project_dir}
        gitBranch={session.git_branch}
        costUsd={session.total_cost_usd}
        model={session.current_model}
        contextPercent={session.context_percent}
        isConnected={isConnected}
      />

      <GitPanel sessionId={id} />

      <FlatList
        ref={flatListRef}
        data={reversedMessages}
        inverted
        keyExtractor={(item, i) => `${item.timestamp}-${item.type}-${reversedMessages.length - 1 - i}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        ListEmptyComponent={
          !isThinking ? (
            <View style={[styles.empty, { transform: [{ scaleY: -1 }] }]}>
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
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
          onSend={async (text, attachments) => {
            let prompt = text;
            if (attachments?.length) {
              try {
                const result = await uploadFiles.mutateAsync(attachments);
                const paths = result.files.map((f) => `- ${f.path}`).join('\n');
                prompt = `<attached-files>\nThese files were uploaded from the user's mobile device. Use the Read tool to view each one.\n${paths}\n</attached-files>\n\n${text}`;
              } catch {
                Alert.alert('Upload Failed', 'Could not upload attachments. Please try again.');
                return;
              }
            }
            if (prompt.trim()) {
              sendPrompt.mutate(prompt);
            }
          }}
          onCommand={handleCommand}
          disabled={sendPrompt.isPending || uploadFiles.isPending}
          placeholder="Message Claude..."
          initialText={pendingSkillInsert}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    headerTitleText: { fontSize: FontSize.lg, fontWeight: '600', color: c.text, flexShrink: 1 },
    listContent: {
      paddingVertical: Spacing.md,
      paddingTop: Spacing.xl,
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
      color: c.buttonText,
      fontSize: FontSize.sm,
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
      ...shadowCard,
    },
    thinkingText: {
      fontSize: FontSize.sm,
      color: c.textMuted,
    },
  });
