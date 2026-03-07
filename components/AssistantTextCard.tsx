import { View, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily } from '../constants/theme';

export function AssistantTextCard({ text }: { text: string }) {
  return (
    <View style={styles.card}>
      <Markdown
        style={{
          body: { color: Colors.text, fontSize: FontSize.md },
          code_inline: {
            backgroundColor: Colors.background,
            color: Colors.primary,
            fontFamily: FontFamily.mono,
            fontSize: FontSize.sm,
          },
          fence: {
            backgroundColor: Colors.background,
            color: Colors.text,
            fontFamily: FontFamily.mono,
            fontSize: FontSize.sm,
            padding: Spacing.md,
            borderRadius: BorderRadius.sm,
          },
          link: { color: Colors.primary },
          heading1: { color: Colors.text, fontWeight: '700' },
          heading2: { color: Colors.text, fontWeight: '700' },
          heading3: { color: Colors.text, fontWeight: '600' },
        }}
      >
        {text}
      </Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
});
