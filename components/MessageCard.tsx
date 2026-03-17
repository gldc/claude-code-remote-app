import { View, Text, StyleSheet } from 'react-native';
import type { NativeEvent } from '../lib/types';
import { AssistantTextCard } from './AssistantTextCard';
import { AssistantCard } from './AssistantCard';
import { CopyablePressable } from './CopyablePressable';
import { ToolUseCard } from './ToolUseCard';
import { ToolResultCard } from './ToolResultCard';
import { BashOutputCard } from './BashOutputCard';
import { ApprovalCard } from './ApprovalCard';
import { useShowCost } from '../lib/api';
import { ErrorCard } from './ErrorCard';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { shadowCard } from '../constants/shadows';

interface Props {
  message: NativeEvent;
  sessionId: string;
  isFirstInGroup?: boolean;
}

export function MessageCard({ message, sessionId, isFirstInGroup }: Props) {
  const showCost = useShowCost();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  switch (message.type) {
    // --- Native event types ---
    case 'user': {
      const content = typeof message.message?.content === 'string'
        ? message.message.content
        : JSON.stringify(message.message?.content);
      return (
        <View style={styles.userRow}>
          <CopyablePressable text={content} style={styles.userBubble}>
            <Text style={styles.userText}>{content}</Text>
          </CopyablePressable>
        </View>
      );
    }

    case 'assistant':
      return <AssistantCard event={message} isFirstInGroup={isFirstInGroup} />;

    case 'tool_result':
      return (
        <ToolResultCard
          content={message.content ?? message.data?.output ?? message.data?.content ?? ''}
          isError={message.is_error ?? message.data?.is_error}
          toolUseId={message.tool_use_id ?? message.data?.tool_use_id}
        />
      );

    case 'approval_request':
      return (
        <ApprovalCard
          sessionId={sessionId}
          toolName={message.data.tool_name}
          toolInput={message.data.tool_input}
          description={message.data.description}
          resolved={message.data.resolved}
          approved={message.data.approved}
        />
      );

    case 'result': {
      const isSuccess = message.subtype === 'success';
      return (
        <View style={styles.statusRow}>
          <View style={styles.statusLine} />
          <Text style={styles.statusText}>
            {isSuccess ? 'Turn complete' : 'Error'}
            {showCost && message.total_cost_usd ? ` · $${Number(message.total_cost_usd).toFixed(2)}` : ''}
          </Text>
          <View style={styles.statusLine} />
        </View>
      );
    }

    case 'rate_limit_event':
      return (
        <View style={styles.statusRow}>
          <View style={styles.statusLine} />
          <Text style={styles.statusText}>Rate limited — retrying</Text>
          <View style={styles.statusLine} />
        </View>
      );

    case 'error':
      return <ErrorCard message={message.data?.message || message.error || 'Unknown error'} />;

    // --- Legacy types (pre-migration sessions) ---
    case 'user_message':
      return (
        <View style={styles.userRow}>
          <CopyablePressable text={message.data.text} style={styles.userBubble}>
            <Text style={styles.userText}>{message.data.text}</Text>
          </CopyablePressable>
        </View>
      );
    case 'assistant_text':
      return (
        <View style={styles.assistantRow}>
          <View style={styles.avatarCol}>
            {isFirstInGroup && (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>C</Text>
              </View>
            )}
          </View>
          <View style={styles.assistantBubble}>
            <AssistantTextCard text={message.data.text} />
          </View>
        </View>
      );
    case 'tool_use':
      return (
        <ToolUseCard
          toolName={message.data.tool_name}
          toolInput={message.data.tool_input}
          toolUseId={message.data.tool_use_id}
        />
      );
    case 'bash_output':
      return <BashOutputCard output={message.data.output} />;
    case 'rate_limit':
      return (
        <View style={styles.statusRow}>
          <View style={styles.statusLine} />
          <Text style={styles.statusText}>Rate limited — retrying</Text>
          <View style={styles.statusLine} />
        </View>
      );
    case 'status_change':
      return (
        <View style={styles.statusRow}>
          <View style={styles.statusLine} />
          <Text style={styles.statusText}>
            {message.data.status === 'completed' ? 'Turn complete' : message.data.status}
            {showCost && message.data.cost_usd ? ` · $${Number(message.data.cost_usd).toFixed(2)}` : ''}
          </Text>
          <View style={styles.statusLine} />
        </View>
      );

    default:
      return null;
  }
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    userRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xs,
    },
    userBubble: {
      backgroundColor: c.primary,
      borderRadius: 18,
      borderBottomRightRadius: 4,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      maxWidth: '78%',
    },
    userText: {
      color: c.buttonText,
      fontSize: FontSize.md,
      lineHeight: 21,
    },
    assistantRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingRight: Spacing.xl,
      paddingVertical: Spacing.xs,
    },
    avatarCol: {
      width: 40,
      alignItems: 'center',
      paddingTop: Spacing.xs,
    },
    avatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: c.buttonText,
      fontSize: FontSize.sm,
      fontWeight: '700',
    },
    assistantBubble: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 16,
      borderTopLeftRadius: 4,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      ...shadowCard,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    statusLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.cardBorder,
    },
    statusText: {
      fontSize: FontSize.xs,
      color: c.textMuted,
    },
  });
