import { View, Text, StyleSheet } from 'react-native';
import type { WSMessageData } from '../lib/types';
import { AssistantTextCard } from './AssistantTextCard';
import { ToolUseCard } from './ToolUseCard';
import { ToolResultCard } from './ToolResultCard';
import { BashOutputCard } from './BashOutputCard';
import { ApprovalCard } from './ApprovalCard';
import { ErrorCard } from './ErrorCard';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { shadowCard } from '../constants/shadows';

interface Props {
  message: WSMessageData;
  sessionId: string;
  isFirstInGroup?: boolean;
}

export function MessageCard({ message, sessionId, isFirstInGroup }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  switch (message.type) {
    case 'user_message':
      return (
        <View style={styles.userRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{message.data.text}</Text>
          </View>
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
        />
      );
    case 'tool_result':
      return (
        <ToolResultCard
          output={message.data.output ?? message.data.content ?? ''}
          isError={message.data.is_error}
        />
      );
    case 'bash_output':
      return <BashOutputCard output={message.data.output} />;
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
    case 'error':
      return <ErrorCard message={message.data.message || 'Unknown error'} />;
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
            {message.data.cost_usd ? ` · $${Number(message.data.cost_usd).toFixed(2)}` : ''}
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
