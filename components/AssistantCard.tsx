import { View, Text, StyleSheet } from 'react-native';
import type { AssistantEvent } from '../lib/types';
import { AssistantTextCard } from './AssistantTextCard';
import { ToolUseCard } from './ToolUseCard';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { shadowCard } from '../constants/shadows';

interface Props {
  event: AssistantEvent;
  isFirstInGroup?: boolean;
}

export function AssistantCard({ event, isFirstInGroup }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const content = event.message?.content || [];

  return (
    <View style={styles.container}>
      <View style={styles.avatarCol}>
        {isFirstInGroup && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </View>
        )}
      </View>
      <View style={styles.blocks}>
        {content.map((block, i) => {
          if (block.type === 'text') {
            return <AssistantTextCard key={i} text={block.text} />;
          }
          if (block.type === 'tool_use') {
            return (
              <ToolUseCard
                key={i}
                toolName={block.name}
                toolInput={block.input}
                toolUseId={block.id}
              />
            );
          }
          return null;
        })}
      </View>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
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
    blocks: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 16,
      borderTopLeftRadius: 4,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      gap: Spacing.xs,
      ...shadowCard,
    },
  });
